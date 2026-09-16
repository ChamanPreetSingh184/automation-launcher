namespace AutomationAgent.Models;

public enum AppTheme
{
    Dark,
    Light,
    System,
}

/// <summary>When the startup profile runs: right after signing into Windows, or at a fixed clock time every day.</summary>
public enum StartupTriggerType
{
    Login,
    DailyAtTime,
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
    public StartupTriggerType StartupTriggerType { get; set; } = StartupTriggerType.Login;

    /// <summary>Only used when StartupTriggerType is Login: seconds to wait after signing in before running.</summary>
    public int StartupDelaySeconds { get; set; } = 10;

    /// <summary>Only used when StartupTriggerType is DailyAtTime: 24-hour "HH:mm", e.g. "17:00".</summary>
    public string? StartupDailyTime { get; set; }

    // Appearance
    public AppTheme Theme { get; set; } = AppTheme.Dark;
}
