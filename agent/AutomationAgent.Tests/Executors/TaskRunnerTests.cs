using AutomationAgent.Executors;
using AutomationAgent.Logging;
using AutomationAgent.Models;
using AutomationAgent.Services;
using AutomationAgent.Tests;

namespace AutomationAgent.Tests.Executors;

public class TaskRunnerTests
{
    private static (TaskRunner Runner, ProfileManager Profiles) CreateRunner(TestTempDir dir)
    {
        var logger = new AutomationLogger();
        var store = new ConfigurationStore(logger, dir.FilePath("profiles.json"), dir.FilePath("settings.json"));
        var profiles = new ProfileManager(store);
        var history = new ExecutionHistoryStore(dir.FilePath("executions"));
        return (new TaskRunner(profiles, history, logger), profiles);
    }

    [Fact]
    public async Task RunAsync_UnknownProfile_ReturnsErrorWithoutStarting()
    {
        using var dir = new TestTempDir();
        var (runner, _) = CreateRunner(dir);

        var outcome = await runner.RunAsync("missing-id", "Manual", null, CancellationToken.None);

        Assert.False(outcome.Started);
        Assert.Equal("Profile not found.", outcome.Error);
    }

    [Fact]
    public async Task RunAsync_DisabledTask_IsSkippedAndNotExecuted()
    {
        using var dir = new TestTempDir();
        var (runner, profiles) = CreateRunner(dir);
        var profile = profiles.Save(new AutomationProfile
        {
            Name = "P",
            Tasks = [new AutomationTask { Name = "Off", Type = TaskType.Wait, Enabled = false, DelaySeconds = 5 }],
        });

        var outcome = await runner.RunAsync(profile.Id, "Manual", null, CancellationToken.None);

        Assert.True(outcome.Started);
        Assert.Equal(TaskExecutionStatus.Skipped, outcome.Record!.TaskResults[0].Status);
    }

    [Fact]
    public async Task RunAsync_ContinuesPastAFailedTaskAndReportsCompletedWithErrors()
    {
        using var dir = new TestTempDir();
        var (runner, profiles) = CreateRunner(dir);
        var profile = profiles.Save(new AutomationProfile
        {
            Name = "P",
            Tasks =
            [
                new AutomationTask
                {
                    Name = "Bad app",
                    Type = TaskType.Application,
                    Configuration = new TaskConfiguration { ApplicationPath = @"C:\nope.exe" },
                },
                new AutomationTask { Name = "Then wait", Type = TaskType.Wait, DelaySeconds = 0 },
            ],
        });

        var outcome = await runner.RunAsync(profile.Id, "Manual", null, CancellationToken.None);

        Assert.True(outcome.Started);
        Assert.Equal(2, outcome.Record!.TaskResults.Count);
        Assert.Equal(TaskExecutionStatus.Failed, outcome.Record.TaskResults[0].Status);
        Assert.Equal(TaskExecutionStatus.Completed, outcome.Record.TaskResults[1].Status);
        Assert.Equal(ExecutionStatus.CompletedWithErrors, outcome.Record.Status);
    }

    [Fact]
    public async Task RunAsync_SecondCallWhileFirstIsActive_ReturnsAlreadyRunning()
    {
        using var dir = new TestTempDir();
        var (runner, profiles) = CreateRunner(dir);
        var profile = profiles.Save(new AutomationProfile
        {
            Name = "Slow",
            Tasks = [new AutomationTask { Name = "Long wait", Type = TaskType.Wait, DelaySeconds = 2 }],
        });

        var firstRunTask = runner.RunAsync(profile.Id, "Manual", null, CancellationToken.None);
        await Task.Delay(200); // let the first run actually start before we try to overlap it

        var secondOutcome = await runner.RunAsync(profile.Id, "Manual", null, CancellationToken.None);
        Assert.False(secondOutcome.Started);
        Assert.Equal("Automation is already running.", secondOutcome.Error);

        var firstOutcome = await firstRunTask;
        Assert.True(firstOutcome.Started);
    }

    [Fact]
    public async Task RunAsync_TasksExecuteInOrderRegardlessOfListOrdering()
    {
        using var dir = new TestTempDir();
        var (runner, profiles) = CreateRunner(dir);
        var profile = profiles.Save(new AutomationProfile
        {
            Name = "Ordered",
            Tasks =
            [
                new AutomationTask { Name = "First", Type = TaskType.Wait, DelaySeconds = 0 },
                new AutomationTask { Name = "Second", Type = TaskType.Wait, DelaySeconds = 0 },
                new AutomationTask { Name = "Third", Type = TaskType.Wait, DelaySeconds = 0 },
            ],
        });

        var outcome = await runner.RunAsync(profile.Id, "Manual", null, CancellationToken.None);

        var names = outcome.Record!.TaskResults.Select(r => r.TaskName).ToList();
        Assert.Equal(["First", "Second", "Third"], names);
    }
}
