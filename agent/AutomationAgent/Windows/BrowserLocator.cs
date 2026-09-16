namespace AutomationAgent.Windows;

/// <summary>Finds Chrome/Edge in the handful of places Windows normally installs them.</summary>
public static class BrowserLocator
{
    public static string? FindChrome()
    {
        return FindFirstExisting(
            Combine(Environment.SpecialFolder.ProgramFiles, "Google\\Chrome\\Application\\chrome.exe"),
            Combine(Environment.SpecialFolder.ProgramFilesX86, "Google\\Chrome\\Application\\chrome.exe"),
            Combine(Environment.SpecialFolder.LocalApplicationData, "Google\\Chrome\\Application\\chrome.exe"));
    }

    public static string? FindEdge()
    {
        return FindFirstExisting(
            Combine(Environment.SpecialFolder.ProgramFilesX86, "Microsoft\\Edge\\Application\\msedge.exe"),
            Combine(Environment.SpecialFolder.ProgramFiles, "Microsoft\\Edge\\Application\\msedge.exe"));
    }

    private static string Combine(Environment.SpecialFolder folder, string relative) =>
        Path.Combine(Environment.GetFolderPath(folder), relative);

    private static string? FindFirstExisting(params string[] candidates) =>
        candidates.FirstOrDefault(File.Exists);
}
