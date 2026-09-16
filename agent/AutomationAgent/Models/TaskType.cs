namespace AutomationAgent.Models;

/// <summary>The kind of action an AutomationTask performs. Kept extensible for future task types.</summary>
public enum TaskType
{
    Application,
    Url,
    Chrome,
    Edge,
    Wait,
}
