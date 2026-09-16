using System.Threading;
using AutomationAgent.Executors;
using AutomationAgent.Logging;
using AutomationAgent.Services;
using AutomationAgent.Storage;

AppPaths.EnsureDirectoriesExist();

var logger = new AutomationLogger();
var isStartupLaunch = args.Contains("--startup");

using var singleInstance = SingleInstance.TryAcquire();
if (singleInstance is null)
{
    logger.Info("Another AutomationAgent instance is already running - exiting.");
    return;
}

logger.Info(isStartupLaunch ? "Agent starting (launched at Windows login)." : "Agent starting.");

var configStore = new ConfigurationStore(logger);
var profileManager = new ProfileManager(configStore);
var historyStore = new ExecutionHistoryStore();
var taskRunner = new TaskRunner(profileManager, historyStore, logger);
var startupManager = new StartupManager(configStore, taskRunner, logger);
var ipcServer = new IpcServer(profileManager, configStore, historyStore, taskRunner, startupManager, logger);

using var cts = new CancellationTokenSource();
Console.CancelKeyPress += (_, e) =>
{
    e.Cancel = true;
    cts.Cancel();
};

var serverTask = ipcServer.RunAsync(cts.Token);

if (isStartupLaunch)
{
    _ = startupManager.RunStartupSequenceAsync(cts.Token);
}

await serverTask;
logger.Info("Agent stopped.");
