namespace AutomationAgent.Services;

/// <summary>
/// Guarantees only one AutomationAgent process runs per Windows user, whether
/// it was started by Tauri or by the Task Scheduler login task.
/// </summary>
public class SingleInstance : IDisposable
{
    private const string MutexName = "Local\\AutomationLauncher.Agent.SingleInstance";
    private readonly Mutex _mutex;

    private SingleInstance(Mutex mutex) => _mutex = mutex;

    /// <summary>Returns an acquired instance, or null if another agent process already holds it.</summary>
    public static SingleInstance? TryAcquire()
    {
        var mutex = new Mutex(initiallyOwned: true, MutexName, out var createdNew);
        if (createdNew)
        {
            return new SingleInstance(mutex);
        }

        mutex.Dispose();
        return null;
    }

    public void Dispose()
    {
        _mutex.ReleaseMutex();
        _mutex.Dispose();
    }
}
