using AutomationAgent.Executors;
using AutomationAgent.Models;

namespace AutomationAgent.Tests.Executors;

public class ApplicationExecutorTests
{
    [Fact]
    public async Task ExecuteAsync_MissingExecutable_ReturnsFailedWithUnderstandableMessage()
    {
        var executor = new ApplicationExecutor();
        var task = new AutomationTask
        {
            Type = TaskType.Application,
            Configuration = new TaskConfiguration { ApplicationPath = @"C:\does\not\exist.exe" },
        };

        var outcome = await executor.ExecuteAsync(task, CancellationToken.None);

        Assert.Equal(TaskExecutionStatus.Failed, outcome.Status);
        Assert.Contains("could not be found", outcome.ErrorMessage);
        Assert.DoesNotContain("System.", outcome.ErrorMessage);
    }

    [Fact]
    public async Task ExecuteAsync_MissingShortcut_ReturnsFailedWithUnderstandableMessage()
    {
        var executor = new ApplicationExecutor();
        var task = new AutomationTask
        {
            Type = TaskType.Application,
            Configuration = new TaskConfiguration { ApplicationPath = @"C:\does\not\exist.lnk" },
        };

        var outcome = await executor.ExecuteAsync(task, CancellationToken.None);

        Assert.Equal(TaskExecutionStatus.Failed, outcome.Status);
        Assert.Contains("could not be found", outcome.ErrorMessage);
    }

    [Fact]
    public async Task ExecuteAsync_UnsupportedFileType_IsRejectedBeforeCheckingWhetherItExists()
    {
        var tempFile = Path.GetTempFileName(); // a real, existing file, but not .exe or .lnk
        try
        {
            var executor = new ApplicationExecutor();
            var task = new AutomationTask
            {
                Type = TaskType.Application,
                Configuration = new TaskConfiguration { ApplicationPath = tempFile },
            };

            var outcome = await executor.ExecuteAsync(task, CancellationToken.None);

            Assert.Equal(TaskExecutionStatus.Failed, outcome.Status);
            Assert.Contains(".exe", outcome.ErrorMessage);
            Assert.Contains(".lnk", outcome.ErrorMessage);
        }
        finally
        {
            File.Delete(tempFile);
        }
    }

    [Fact]
    public async Task ExecuteAsync_NoPathConfigured_ReturnsFailedWithoutThrowing()
    {
        var executor = new ApplicationExecutor();
        var task = new AutomationTask { Type = TaskType.Application, Configuration = new TaskConfiguration() };

        var outcome = await executor.ExecuteAsync(task, CancellationToken.None);

        Assert.Equal(TaskExecutionStatus.Failed, outcome.Status);
    }
}
