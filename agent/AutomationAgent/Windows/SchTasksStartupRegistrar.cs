using System.Diagnostics;

namespace AutomationAgent.Windows;

/// <summary>
/// Registers/unregisters the per-user "run at login" task via schtasks.exe.
/// Arguments are always passed as a fixed, itemized ArgumentList - never a
/// concatenated shell string - so nothing here ever interprets user input as
/// a command. The startup delay itself is handled by the agent's own
/// --startup mode (see Program.cs), not by schtasks, so changing the delay in
/// Settings never requires re-registering the task.
/// </summary>
public static class SchTasksStartupRegistrar
{
    public const string TaskName = "AutomationLauncherAgent";

    public static string[] BuildCreateArgs(string agentExePath) =>
    [
        "/Create",
        "/TN", TaskName,
        "/TR", $"\"{agentExePath}\" --startup",
        "/SC", "ONLOGON",
        "/RL", "LIMITED",
        "/F",
    ];

    public static string[] BuildDeleteArgs() => ["/Delete", "/TN", TaskName, "/F"];

    /// <summary>Actually registers the task. Not called anywhere during development - only from the Settings UI.</summary>
    public static Task<(bool Success, string Output)> RegisterAsync(string agentExePath) =>
        RunSchTasks(BuildCreateArgs(agentExePath));

    public static Task<(bool Success, string Output)> UnregisterAsync() =>
        RunSchTasks(BuildDeleteArgs());

    private static async Task<(bool Success, string Output)> RunSchTasks(string[] args)
    {
        var startInfo = new ProcessStartInfo("schtasks.exe")
        {
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };
        foreach (var arg in args)
        {
            startInfo.ArgumentList.Add(arg);
        }

        using var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Could not start schtasks.exe.");

        var output = await process.StandardOutput.ReadToEndAsync();
        var error = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        return (process.ExitCode == 0, process.ExitCode == 0 ? output : error);
    }
}
