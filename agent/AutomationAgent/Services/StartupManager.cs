using AutomationAgent.Executors;
using AutomationAgent.Logging;
using AutomationAgent.Models;
using AutomationAgent.Windows;

namespace AutomationAgent.Services;

/// <summary>
/// Runs the "execute the startup profile" sequence used when the agent is
/// launched with --startup by Task Scheduler, and wraps Register/Unregister
/// for the Settings UI.
/// </summary>
public class StartupManager(
    ConfigurationStore configStore,
    TaskRunner taskRunner,
    AutomationLogger logger)
{
    public async Task RunStartupSequenceAsync(CancellationToken cancellationToken)
    {
        var settings = configStore.LoadSettings();
        if (!settings.StartupAutomationEnabled || string.IsNullOrEmpty(settings.StartupProfileId))
        {
            logger.Info("Startup automation is disabled or no startup profile is set - nothing to run.");
            return;
        }

        // Only the Login trigger needs an extra wait here - DailyAtTime already
        // fired at the configured clock time, so running immediately is correct.
        if (settings.StartupTriggerType == StartupTriggerType.Login && settings.StartupDelaySeconds > 0)
        {
            logger.Info($"Waiting {settings.StartupDelaySeconds} seconds before running the startup profile.");
            await Task.Delay(TimeSpan.FromSeconds(settings.StartupDelaySeconds), cancellationToken);
        }

        var outcome = await taskRunner.RunAsync(settings.StartupProfileId, "Startup", onTaskUpdate: null, cancellationToken);
        if (!outcome.Started)
        {
            logger.Error($"Startup profile did not run: {outcome.Error}");
        }
    }

    public Task<(bool Success, string Output)> RegisterAsync()
    {
        var exePath = Environment.ProcessPath
            ?? throw new InvalidOperationException("Could not determine the agent's own executable path.");

        var settings = configStore.LoadSettings();
        if (settings.StartupTriggerType == StartupTriggerType.DailyAtTime &&
            !SchTasksStartupRegistrar.IsValidTimeOfDay(settings.StartupDailyTime))
        {
            throw new AgentRequestException("Enter a valid time (HH:MM, 24-hour) before enabling daily startup automation.");
        }

        return SchTasksStartupRegistrar.RegisterAsync(exePath, settings.StartupTriggerType, settings.StartupDailyTime);
    }

    public Task<(bool Success, string Output)> UnregisterAsync() => SchTasksStartupRegistrar.UnregisterAsync();
}
