using System.Diagnostics;
using AutomationAgent.Executors;
using AutomationAgent.Models;

namespace AutomationAgent.Tests.Executors;

public class WaitExecutorTests
{
    [Fact]
    public async Task ExecuteAsync_WaitsAtLeastTheConfiguredDuration()
    {
        var executor = new WaitExecutor();
        var task = new AutomationTask { Type = TaskType.Wait, DelaySeconds = 1 };

        var stopwatch = Stopwatch.StartNew();
        var outcome = await executor.ExecuteAsync(task, CancellationToken.None);
        stopwatch.Stop();

        Assert.Equal(TaskExecutionStatus.Completed, outcome.Status);
        Assert.True(stopwatch.Elapsed >= TimeSpan.FromMilliseconds(900), $"Only waited {stopwatch.Elapsed}");
    }

    [Fact]
    public async Task ExecuteAsync_ZeroDuration_CompletesImmediately()
    {
        var executor = new WaitExecutor();
        var task = new AutomationTask { Type = TaskType.Wait, DelaySeconds = 0 };

        var stopwatch = Stopwatch.StartNew();
        var outcome = await executor.ExecuteAsync(task, CancellationToken.None);
        stopwatch.Stop();

        Assert.Equal(TaskExecutionStatus.Completed, outcome.Status);
        Assert.True(stopwatch.Elapsed < TimeSpan.FromMilliseconds(500));
    }
}
