using System.ComponentModel;
using System.Diagnostics;

namespace AutomationAgent.Executors;

/// <summary>
/// Shared Process.Start wrapper. Every executor launches one specific,
/// already-validated executable (or the default browser via ShellExecute) -
/// never a shell command string - so this never interprets arguments through
/// cmd.exe.
/// </summary>
public static class ProcessLauncher
{
    public static TaskExecutionOutcome Start(string fileName, string? arguments, string friendlyFailureMessage)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments ?? "",
                UseShellExecute = true,
            };
            Process.Start(startInfo);
            return TaskExecutionOutcome.Completed();
        }
        catch (Win32Exception ex)
        {
            return TaskExecutionOutcome.Failed($"{friendlyFailureMessage} ({ex.Message})");
        }
        catch (Exception ex) when (ex is IOException or InvalidOperationException)
        {
            return TaskExecutionOutcome.Failed($"{friendlyFailureMessage} ({ex.Message})");
        }
    }
}
