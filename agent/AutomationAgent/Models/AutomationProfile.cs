namespace AutomationAgent.Models;

public class AutomationProfile
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";

    /// <summary>Name of a Lucide icon to show in the UI (e.g. "rocket"). Purely cosmetic.</summary>
    public string Icon { get; set; } = "rocket";

    public List<AutomationTask> Tasks { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
