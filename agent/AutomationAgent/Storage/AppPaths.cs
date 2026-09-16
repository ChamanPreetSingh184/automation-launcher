namespace AutomationAgent.Storage;

/// <summary>All on-disk locations the agent uses, rooted at %APPDATA%\AutomationLauncher.</summary>
public static class AppPaths
{
    public static string RootDir { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "AutomationLauncher");

    public static string ProfilesFile => Path.Combine(RootDir, "profiles.json");
    public static string SettingsFile => Path.Combine(RootDir, "settings.json");
    public static string ExecutionsDir => Path.Combine(RootDir, "executions");
    public static string LogsDir => Path.Combine(RootDir, "logs");

    public static void EnsureDirectoriesExist()
    {
        Directory.CreateDirectory(RootDir);
        Directory.CreateDirectory(ExecutionsDir);
        Directory.CreateDirectory(LogsDir);
    }
}
