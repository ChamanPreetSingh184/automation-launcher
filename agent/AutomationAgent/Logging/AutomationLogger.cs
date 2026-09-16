using AutomationAgent.Storage;

namespace AutomationAgent.Logging;

/// <summary>
/// Writes one structured line per event to logs\agent-YYYY-MM-DD.log and to the
/// console. A lock keeps lines from interleaving when tasks run concurrently
/// with IPC requests.
/// </summary>
public class AutomationLogger
{
    private readonly object _lock = new();

    public void Info(string message, string? profile = null, string? task = null) =>
        Write("INFO", message, profile, task);

    public void Warn(string message, string? profile = null, string? task = null) =>
        Write("WARN", message, profile, task);

    public void Error(string message, string? profile = null, string? task = null) =>
        Write("ERROR", message, profile, task);

    private void Write(string level, string message, string? profile, string? task)
    {
        var timestamp = DateTimeOffset.Now.ToString("HH:mm:ss");
        var context = string.Join(" ", new[] { profile, task }.Where(s => !string.IsNullOrEmpty(s)));
        var line = context.Length > 0
            ? $"{timestamp} [{level}] [{context}] {message}"
            : $"{timestamp} [{level}] {message}";

        lock (_lock)
        {
            Console.WriteLine(line);
            try
            {
                Directory.CreateDirectory(AppPaths.LogsDir);
                var logFile = Path.Combine(AppPaths.LogsDir, $"agent-{DateTimeOffset.Now:yyyy-MM-dd}.log");
                File.AppendAllText(logFile, line + Environment.NewLine);
            }
            catch (IOException)
            {
                // Logging to disk is best-effort; losing a log line must never crash the agent.
            }
        }
    }
}
