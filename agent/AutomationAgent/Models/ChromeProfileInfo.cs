namespace AutomationAgent.Models;

/// <summary>One entry discovered from Chrome's "Local State" file.</summary>
public class ChromeProfileInfo
{
    /// <summary>Directory name Chrome uses internally, e.g. "Default", "Profile 1". Pass to --profile-directory.</summary>
    public string DirectoryName { get; set; } = "";

    /// <summary>Friendly name the user gave the profile in Chrome, e.g. "Work".</summary>
    public string DisplayName { get; set; } = "";
}
