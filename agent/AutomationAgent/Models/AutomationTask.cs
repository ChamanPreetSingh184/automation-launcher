namespace AutomationAgent.Models;

public class AutomationTask
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = "";
    public TaskType Type { get; set; }
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Seconds to pause after this task finishes, before the next task starts.
    /// For a WAIT task, this is also the task's own duration - executing a WAIT
    /// task simply means pausing for DelaySeconds, so no extra post-task delay
    /// is applied afterwards (see TaskRunner).
    /// </summary>
    public int DelaySeconds { get; set; }

    public TaskConfiguration Configuration { get; set; } = new();

    /// <summary>Position within the profile's task list (0-based). Drives execution order.</summary>
    public int Order { get; set; }
}
