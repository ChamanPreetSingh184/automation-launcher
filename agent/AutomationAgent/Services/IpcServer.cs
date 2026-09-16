using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using AutomationAgent.Executors;
using AutomationAgent.Logging;
using AutomationAgent.Models;
using AutomationAgent.Storage;
using AutomationAgent.Windows;

namespace AutomationAgent.Services;

/// <summary>
/// The agent's only entry point for the outside world: a loopback-only TCP
/// listener speaking newline-delimited JSON. Each connection is handled on
/// its own task, and each request line on that connection is dispatched to
/// its own task too, so a slow command (like "run") never blocks other
/// commands on the same connection - responses/events are matched back to
/// the right caller purely by the "id"/"runId" fields, since writes to a
/// connection are serialized through one lock.
/// </summary>
public class IpcServer(
    ProfileManager profileManager,
    ConfigurationStore configStore,
    ExecutionHistoryStore historyStore,
    TaskRunner taskRunner,
    StartupManager startupManager,
    AutomationLogger logger)
{
    public const int Port = 51823;

    private volatile bool _shutdownRequested;

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        TcpListener listener;
        try
        {
            listener = new TcpListener(IPAddress.Loopback, Port);
            listener.Start();
        }
        catch (SocketException ex)
        {
            logger.Error(
                $"Could not start the local agent listener on 127.0.0.1:{Port}: {ex.Message}. " +
                "Another process may already be using this port. The agent will exit instead of retrying.");
            return;
        }

        logger.Info($"Agent listening on 127.0.0.1:{Port}.");

        try
        {
            while (!cancellationToken.IsCancellationRequested && !_shutdownRequested)
            {
                TcpClient client;
                try
                {
                    client = await listener.AcceptTcpClientAsync(cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                _ = HandleConnectionAsync(client, cancellationToken);
            }
        }
        finally
        {
            listener.Stop();
        }
    }

    private async Task HandleConnectionAsync(TcpClient client, CancellationToken cancellationToken)
    {
        using var clientGuard = client;
        var stream = client.GetStream();
        var reader = new StreamReader(stream, Encoding.UTF8);
        var writer = new StreamWriter(stream, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false)) { AutoFlush = false };
        var writeLock = new SemaphoreSlim(1, 1);

        async Task SendAsync(object message)
        {
            var json = JsonSerializer.Serialize(message, JsonOptions.Compact);
            await writeLock.WaitAsync(cancellationToken);
            try
            {
                await writer.WriteLineAsync(json);
                await writer.FlushAsync(cancellationToken);
            }
            finally
            {
                writeLock.Release();
            }
        }

        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(cancellationToken);
                if (line is null)
                {
                    break; // client closed the connection
                }
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                _ = HandleRequestLineAsync(line, SendAsync, cancellationToken);
            }
        }
        catch (IOException)
        {
            // Client disconnected mid-read - nothing to clean up.
        }
        catch (OperationCanceledException)
        {
            // Server is shutting down.
        }
    }

    private async Task HandleRequestLineAsync(string line, Func<object, Task> send, CancellationToken cancellationToken)
    {
        string? id = null;
        try
        {
            var request = JsonSerializer.Deserialize<IpcRequest>(line, JsonOptions.Compact);
            if (request is null)
            {
                return;
            }
            id = request.Id;

            var data = await Dispatch(request, send, cancellationToken);
            await send(new IpcResponse("response", id, true, data, null));
        }
        catch (AgentRequestException ex)
        {
            await send(new IpcResponse("response", id, false, null, ex.Message));
        }
        catch (Exception ex)
        {
            logger.Error($"Unhandled IPC error: {ex.Message}");
            await send(new IpcResponse("response", id, false, null, "The agent hit an unexpected error handling this request."));
        }
    }

    private async Task<object?> Dispatch(IpcRequest request, Func<object, Task> send, CancellationToken cancellationToken)
    {
        switch (request.Command)
        {
            case "ping":
                return new { pong = true };

            case "list-profiles":
                return profileManager.List();

            case "get-profile":
                return profileManager.Get(RequireString(request, "id")) ?? throw new AgentRequestException("Profile not found.");

            case "save-profile":
                return profileManager.Save(RequireObject<AutomationProfile>(request, "profile"));

            case "delete-profile":
                return new { deleted = profileManager.Delete(RequireString(request, "id")) };

            case "duplicate-profile":
                return profileManager.Duplicate(RequireString(request, "id"));

            case "get-settings":
                return configStore.LoadSettings();

            case "save-settings":
                var settings = RequireObject<AppSettings>(request, "settings");
                configStore.SaveSettings(settings);
                return settings;

            case "list-chrome-profiles":
                return ChromeProfileDiscovery.Discover();

            case "list-executions":
                return historyStore.List();

            case "get-execution":
                return historyStore.Get(RequireString(request, "id")) ?? throw new AgentRequestException("Execution not found.");

            case "run":
                return await HandleRun(request, send, cancellationToken);

            case "agent-status":
                return new { running = true, activeRun = taskRunner.IsRunning };

            case "register-startup":
                var (registerOk, registerOutput) = await startupManager.RegisterAsync();
                if (!registerOk)
                {
                    throw new AgentRequestException($"Could not register startup automation. {registerOutput}".Trim());
                }
                return new { registered = true };

            case "unregister-startup":
                var (unregisterOk, unregisterOutput) = await startupManager.UnregisterAsync();
                if (!unregisterOk)
                {
                    throw new AgentRequestException($"Could not remove startup automation. {unregisterOutput}".Trim());
                }
                return new { registered = false };

            case "open-log-folder":
                Directory.CreateDirectory(AppPaths.LogsDir);
                Process.Start(new ProcessStartInfo("explorer.exe", AppPaths.LogsDir) { UseShellExecute = true });
                return new { opened = true };

            case "shutdown":
                _shutdownRequested = true;
                _ = Task.Run(async () => { await Task.Delay(200, CancellationToken.None); Environment.Exit(0); });
                return new { shuttingDown = true };

            default:
                throw new AgentRequestException($"Unknown command '{request.Command}'.");
        }
    }

    private async Task<ExecutionRecord?> HandleRun(IpcRequest request, Func<object, Task> send, CancellationToken cancellationToken)
    {
        var profileId = RequireString(request, "profileId");
        var runId = request.Id;

        var outcome = await taskRunner.RunAsync(
            profileId,
            triggeredBy: "Manual",
            onTaskUpdate: result => _ = send(new IpcEvent("event", "task-update", runId, result)),
            cancellationToken);

        if (!outcome.Started)
        {
            throw new AgentRequestException(outcome.Error ?? "Could not start the run.");
        }

        return outcome.Record;
    }

    private static string RequireString(IpcRequest request, string key)
    {
        if (request.Payload.ValueKind == JsonValueKind.Object &&
            request.Payload.TryGetProperty(key, out var element) &&
            element.ValueKind == JsonValueKind.String)
        {
            var value = element.GetString();
            if (!string.IsNullOrEmpty(value))
            {
                return value;
            }
        }

        throw new AgentRequestException($"Missing required field '{key}'.");
    }

    private static T RequireObject<T>(IpcRequest request, string key)
    {
        if (request.Payload.ValueKind == JsonValueKind.Object &&
            request.Payload.TryGetProperty(key, out var element))
        {
            var value = element.Deserialize<T>(JsonOptions.Compact);
            if (value is not null)
            {
                return value;
            }
        }

        throw new AgentRequestException($"Missing required field '{key}'.");
    }
}
