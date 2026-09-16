using AutomationAgent.Windows;

namespace AutomationAgent.Tests.Windows;

/// <summary>
/// Only tests the argument arrays SchTasksStartupRegistrar would pass to
/// schtasks.exe. schtasks.exe itself is never invoked by these tests -
/// registering a real login task is left for the user to trigger from the app.
/// </summary>
public class SchTasksStartupRegistrarTests
{
    [Fact]
    public void BuildCreateArgs_UsesOnLogonTriggerAndTheAgentExeWithStartupFlag()
    {
        var args = SchTasksStartupRegistrar.BuildCreateArgs(@"C:\Program Files\AutomationLauncher\AutomationAgent.exe");

        Assert.Equal("/Create", args[0]);
        Assert.Contains("/TN", args);
        Assert.Contains(SchTasksStartupRegistrar.TaskName, args);
        Assert.Contains("/SC", args);
        Assert.Contains("ONLOGON", args);
        Assert.Contains("/F", args);
        Assert.Contains(args, a => a.Contains("AutomationAgent.exe") && a.Contains("--startup"));
    }

    [Fact]
    public void BuildCreateArgs_NeverProducesAShellString_EachArgumentIsASeparateArrayElement()
    {
        var args = SchTasksStartupRegistrar.BuildCreateArgs(@"C:\AutomationAgent.exe");

        // A shell-string approach would put the whole command in one element; ours is itemized.
        Assert.True(args.Length > 5);
        Assert.DoesNotContain(args, a => a.Contains("&&") || a.Contains("|") || a.Contains(";"));
    }

    [Fact]
    public void BuildDeleteArgs_TargetsTheSameTaskNameByForce()
    {
        var args = SchTasksStartupRegistrar.BuildDeleteArgs();

        Assert.Equal(["/Delete", "/TN", SchTasksStartupRegistrar.TaskName, "/F"], args);
    }
}
