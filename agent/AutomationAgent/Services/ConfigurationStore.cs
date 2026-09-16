using AutomationAgent.Logging;
using AutomationAgent.Models;
using AutomationAgent.Storage;

namespace AutomationAgent.Services;

/// <summary>
/// Owns reading/writing profiles.json and settings.json. The only place that
/// touches those two files. Paths default to the real per-user AppPaths
/// locations; tests pass their own temp-directory paths so they never touch
/// a real user's configuration.
/// </summary>
public class ConfigurationStore(AutomationLogger logger, string? profilesPath = null, string? settingsPath = null)
{
    private readonly string _profilesPath = profilesPath ?? AppPaths.ProfilesFile;
    private readonly string _settingsPath = settingsPath ?? AppPaths.SettingsFile;

    public List<AutomationProfile> LoadProfiles() =>
        JsonFileStore.Load(_profilesPath, () => new List<AutomationProfile>(), msg => logger.Warn(msg));

    public void SaveProfiles(List<AutomationProfile> profiles) =>
        JsonFileStore.SaveAtomic(_profilesPath, profiles);

    public AppSettings LoadSettings() =>
        JsonFileStore.Load(_settingsPath, () => new AppSettings(), msg => logger.Warn(msg));

    public void SaveSettings(AppSettings settings) =>
        JsonFileStore.SaveAtomic(_settingsPath, settings);
}
