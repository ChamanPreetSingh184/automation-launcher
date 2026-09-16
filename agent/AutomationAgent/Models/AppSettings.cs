namespace AutomationAgent.Models;

public enum AppTheme
{
    Dark,
    Light,
    System,
}

/// <summary>
/// The single settings.json document. Which profile runs at login is stored
/// here (StartupProfileId) rather than as a flag on each profile, so there is
/// never more than one startup profile to keep consistent.
/// </summary>
public class AppSettings
{
    // General
    public bool StartWithWindows { get; set; }
    public bool StartMinimized { get; set; }

    // Startup automation
    public bool StartupAutomationEnabled { get; set; }
    public string? StartupProfileId { get; set; }
    public int StartupDelaySeconds { get; set; } = 10;

    // Appearance
    public AppTheme Theme { get; set; } = AppTheme.Dark;
}
