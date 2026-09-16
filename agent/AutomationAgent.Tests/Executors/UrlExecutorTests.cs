using AutomationAgent.Executors;
using AutomationAgent.Models;

namespace AutomationAgent.Tests.Executors;

public class UrlExecutorTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-a-url")]
    [InlineData("ftp://example.com")]
    [InlineData("javascript:alert(1)")]
    public async Task ExecuteAsync_InvalidUrl_ReturnsFailedWithoutLaunchingAnything(string? url)
    {
        var executor = new UrlExecutor();
        var task = new AutomationTask { Type = TaskType.Url, Configuration = new TaskConfiguration { Url = url } };

        var outcome = await executor.ExecuteAsync(task, CancellationToken.None);

        Assert.Equal(TaskExecutionStatus.Failed, outcome.Status);
    }

    [Theory]
    [InlineData("https://example.com")]
    [InlineData("http://example.com")]
    public void IsValidHttpUrl_AcceptsHttpAndHttps(string url)
    {
        Assert.True(UrlValidation.IsValidHttpUrl(url));
    }
}
