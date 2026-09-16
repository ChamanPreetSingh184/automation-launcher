using AutomationAgent.Models;

namespace AutomationAgent.Executors;

/// <summary>
/// Launches either a real executable (.exe) or a Windows shortcut (.lnk).
/// Both go through ProcessLauncher's UseShellExecute=true path, which is how
/// Windows resolves a .lnk to its target itself - we never try to parse or
/// follow the shortcut ourselves.
/// </summary>
public class ApplicationExecutor : ITaskExecutor
{
    private static readonly string[] SupportedExtensions = [".exe", ".lnk"];

    public Task<TaskExecutionOutcome> ExecuteAsync(AutomationTask task, CancellationToken cancellationToken)
    {
        var path = task.Configuration.ApplicationPath;
        if (string.IsNullOrWhiteSpace(path))
        {
            return Task.FromResult(TaskExecutionOutcome.Failed(
                "Could not start the application. No application or shortcut is configured."));
        }

        if (!SupportedExtensions.Contains(Path.GetExtension(path), StringComparer.OrdinalIgnoreCase))
        {
            return Task.FromResult(TaskExecutionOutcome.Failed(
                "Could not start the application. Choose an .exe file or a .lnk shortcut."));
        }

        if (!File.Exists(path))
        {
            return Task.FromResult(TaskExecutionOutcome.Failed(
                "Could not start the application. The configured file could not be found."));
        }

        var outcome = ProcessLauncher.Start(path, task.Configuration.Arguments, "Could not start the application.");
        return Task.FromResult(outcome);
    }
}
