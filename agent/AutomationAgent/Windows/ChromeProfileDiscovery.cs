using System.Text.Json;
using AutomationAgent.Models;

namespace AutomationAgent.Windows;

/// <summary>
/// Reads Chrome's own "Local State" file to list installed profiles. This is
/// read-only and best-effort: if Chrome isn't installed or the file format
/// doesn't match what we expect, we return an empty list rather than throwing,
/// so the UI can fall back to manual profile-directory entry.
/// </summary>
public static class ChromeProfileDiscovery
{
    public static List<ChromeProfileInfo> Discover()
    {
        var localStatePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Google\\Chrome\\User Data\\Local State");

        if (!File.Exists(localStatePath))
        {
            return [];
        }

        try
        {
            using var stream = File.OpenRead(localStatePath);
            using var doc = JsonDocument.Parse(stream);

            if (!doc.RootElement.TryGetProperty("profile", out var profileElement) ||
                !profileElement.TryGetProperty("info_cache", out var infoCache))
            {
                return [];
            }

            var profiles = new List<ChromeProfileInfo>();
            foreach (var entry in infoCache.EnumerateObject())
            {
                var displayName = entry.Value.TryGetProperty("name", out var nameElement)
                    ? nameElement.GetString() ?? entry.Name
                    : entry.Name;

                profiles.Add(new ChromeProfileInfo
                {
                    DirectoryName = entry.Name,
                    DisplayName = displayName,
                });
            }

            return profiles;
        }
        catch (Exception ex) when (ex is JsonException or IOException)
        {
            return [];
        }
    }
}
