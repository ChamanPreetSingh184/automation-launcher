using AutomationAgent.Models;
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
    public void BuildCreateArgs_LoginTrigger_UsesOnLogonTriggerAndTheAgentExeWithStartupFlag()
    {
        var args = SchTasksStartupRegistrar.BuildCreateArgs(
            @"C:\Program Files\AutomationLauncher\AutomationAgent.exe", StartupTriggerType.Login);

        Assert.Equal("/Create", args[0]);
        Assert.Contains("/TN", args);
        Assert.Contains(SchTasksStartupRegistrar.TaskName, args);
        Assert.Contains("/SC", args);
        Assert.Contains("ONLOGON", args);
        Assert.Contains("/F", args);
        Assert.Contains(args, a => a.Contains("AutomationAgent.exe") && a.Contains("--startup"));
    }

    [Fact]
    public void BuildCreateArgs_DailyAtTimeTrigger_UsesDailyScheduleAtTheConfiguredTime()
    {
        var args = SchTasksStartupRegistrar.BuildCreateArgs(
            @"C:\AutomationAgent.exe", StartupTriggerType.DailyAtTime, "17:00");

        Assert.Contains("/SC", args);
        Assert.Contains("DAILY", args);
        Assert.Contains("/ST", args);
        Assert.Contains("17:00", args);
        Assert.DoesNotContain("ONLOGON", args);
    }

    [Fact]
    public void BuildCreateArgs_DailyAtTimeTrigger_RejectsAnInvalidTime()
    {
        Assert.Throws<ArgumentException>(() =>
            SchTasksStartupRegistrar.BuildCreateArgs(@"C:\AutomationAgent.exe", StartupTriggerType.DailyAtTime, "5pm"));
    }

    [Theory]
    [InlineData("00:00", true)]
    [InlineData("17:00", true)]
    [InlineData("23:59", true)]
    [InlineData("24:00", false)]
    [InlineData("9:00", false)]
    [InlineData("17:00:00", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsValidTimeOfDay_AcceptsOnlyTwentyFourHourHhMm(string? value, bool expected)
    {
        Assert.Equal(expected, SchTasksStartupRegistrar.IsValidTimeOfDay(value));
    }

    [Fact]
    public void BuildCreateArgs_NeverProducesAShellString_EachArgumentIsASeparateArrayElement()
    {
        var args = SchTasksStartupRegistrar.BuildCreateArgs(@"C:\AutomationAgent.exe", StartupTriggerType.Login);

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
