using System.Diagnostics;
using System.Text.RegularExpressions;
using AutomationAgent.Models;

namespace AutomationAgent.Windows;

/// <summary>
/// Registers/unregisters the per-user startup task via schtasks.exe, either
/// triggered at login or daily at a fixed clock time. Arguments are always
/// passed as a fixed, itemized ArgumentList - never a concatenated shell
/// string - so nothing here ever interprets user input as a command. For the
/// Login trigger, the delay itself is handled by the agent's own --startup
/// mode (see Program.cs), not by schtasks, so changing the delay in Settings
/// never requires re-registering the task; for DailyAtTime, schtasks itself
/// fires at the configured clock time, so no extra delay is applied.
/// </summary>
public static partial class SchTasksStartupRegistrar
{
    public const string TaskName = "AutomationLauncherAgent";

    [GeneratedRegex(@"^([01]\d|2[0-3]):[0-5]\d$")]
    private static partial Regex TimeOfDayPattern();

    /// <summary>True for a 24-hour "HH:mm" string, e.g. "17:00".</summary>
    public static bool IsValidTimeOfDay(string? value) => value is not null && TimeOfDayPattern().IsMatch(value);

    public static string[] BuildCreateArgs(string agentExePath, StartupTriggerType triggerType, string? dailyTime = null)
    {
        List<string> args =
        [
            "/Create",
            "/TN", TaskName,
            "/TR", $"\"{agentExePath}\" --startup",
            "/RL", "LIMITED",
            "/F",
        ];

        if (triggerType == StartupTriggerType.DailyAtTime)
        {
            if (!IsValidTimeOfDay(dailyTime))
            {
                throw new ArgumentException("dailyTime must be a 24-hour \"HH:mm\" value.", nameof(dailyTime));
            }
            args.AddRange(["/SC", "DAILY", "/ST", dailyTime!]);
        }
        else
        {
            args.AddRange(["/SC", "ONLOGON"]);
        }

        return [.. args];
    }

    public static string[] BuildDeleteArgs() => ["/Delete", "/TN", TaskName, "/F"];

    /// <summary>Actually registers the task. Not called anywhere during development - only from the Settings UI.</summary>
    public static Task<(bool Success, string Output)> RegisterAsync(string agentExePath, StartupTriggerType triggerType, string? dailyTime = null) =>
        RunSchTasks(BuildCreateArgs(agentExePath, triggerType, dailyTime));

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
