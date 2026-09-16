namespace AutomationAgent.Models;

/// <summary>
/// Flat, per-task-type configuration. Only the fields relevant to the task's
/// TaskType are populated; the rest stay null. Kept as one flat class (instead
/// of a class hierarchy) so it round-trips through JSON without any polymorphic
/// serialization setup.
/// </summary>
public class TaskConfiguration
{
    // APPLICATION - an .exe or a .lnk shortcut, both launched the same way (see ApplicationExecutor)
    public string? ApplicationPath { get; set; }
    public string? Arguments { get; set; }

    // URL, CHROME, EDGE
    public string? Url { get; set; }

    // CHROME
    public string? ChromeExecutablePath { get; set; }
    public string? ChromeProfileDirectory { get; set; }

    // EDGE
    public string? EdgeExecutablePath { get; set; }
}
