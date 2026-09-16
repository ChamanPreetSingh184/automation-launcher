using AutomationAgent.Models;

namespace AutomationAgent.Services;

/// <summary>Profile CRUD on top of ConfigurationStore. Keeps ids, timestamps and task order consistent.</summary>
public class ProfileManager(ConfigurationStore store)
{
    public List<AutomationProfile> List() => store.LoadProfiles();

    public AutomationProfile? Get(string id) =>
        store.LoadProfiles().FirstOrDefault(p => p.Id == id);

    /// <summary>Creates a new profile (empty Id) or updates an existing one (matching Id).</summary>
    public AutomationProfile Save(AutomationProfile profile)
    {
        var profiles = store.LoadProfiles();
        var now = DateTimeOffset.UtcNow;

        for (var i = 0; i < profile.Tasks.Count; i++)
        {
            profile.Tasks[i].Order = i;
            if (string.IsNullOrEmpty(profile.Tasks[i].Id))
            {
                profile.Tasks[i].Id = Guid.NewGuid().ToString("N");
            }
        }

        var existingIndex = profiles.FindIndex(p => p.Id == profile.Id);
        if (existingIndex >= 0)
        {
            profile.CreatedAt = profiles[existingIndex].CreatedAt;
            profile.UpdatedAt = now;
            profiles[existingIndex] = profile;
        }
        else
        {
            if (string.IsNullOrEmpty(profile.Id))
            {
                profile.Id = Guid.NewGuid().ToString("N");
            }
            profile.CreatedAt = now;
            profile.UpdatedAt = now;
            profiles.Add(profile);
        }

        store.SaveProfiles(profiles);
        return profile;
    }

    public bool Delete(string id)
    {
        var profiles = store.LoadProfiles();
        var removed = profiles.RemoveAll(p => p.Id == id) > 0;
        if (!removed)
        {
            return false;
        }

        store.SaveProfiles(profiles);

        var settings = store.LoadSettings();
        if (settings.StartupProfileId == id)
        {
            settings.StartupProfileId = null;
            settings.StartupAutomationEnabled = false;
            store.SaveSettings(settings);
        }

        return true;
    }

    public AutomationProfile Duplicate(string id)
    {
        var original = Get(id) ?? throw new InvalidOperationException($"Profile '{id}' not found.");

        var copy = new AutomationProfile
        {
            Id = Guid.NewGuid().ToString("N"),
            Name = $"{original.Name} (Copy)",
            Description = original.Description,
            Icon = original.Icon,
            Tasks = original.Tasks.Select(t => new AutomationTask
            {
                Id = Guid.NewGuid().ToString("N"),
                Name = t.Name,
                Type = t.Type,
                Enabled = t.Enabled,
                DelaySeconds = t.DelaySeconds,
                Order = t.Order,
                Configuration = new Models.TaskConfiguration
                {
                    ApplicationPath = t.Configuration.ApplicationPath,
                    Arguments = t.Configuration.Arguments,
                    Url = t.Configuration.Url,
                    ChromeExecutablePath = t.Configuration.ChromeExecutablePath,
                    ChromeProfileDirectory = t.Configuration.ChromeProfileDirectory,
                    EdgeExecutablePath = t.Configuration.EdgeExecutablePath,
                },
            }).ToList(),
        };

        return Save(copy);
    }
}
