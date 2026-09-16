using AutomationAgent.Models;
using AutomationAgent.Storage;

namespace AutomationAgent.Services;

/// <summary>
/// Persists one JSON file per execution under executions\, newest first when
/// listing. Directory defaults to the real AppPaths.ExecutionsDir; tests pass
/// their own temp directory so they never touch real user data.
/// </summary>
public class ExecutionHistoryStore(string? executionsDir = null)
{
    private readonly string _executionsDir = executionsDir ?? AppPaths.ExecutionsDir;

    public void Save(ExecutionRecord record)
    {
        Directory.CreateDirectory(_executionsDir);
        var path = Path.Combine(_executionsDir, $"{record.Id}.json");
        JsonFileStore.SaveAtomic(path, record);
    }

    public List<ExecutionRecord> List(int limit = 100)
    {
        if (!Directory.Exists(_executionsDir))
        {
            return [];
        }

        var records = new List<ExecutionRecord>();
        foreach (var file in Directory.EnumerateFiles(_executionsDir, "*.json"))
        {
            var record = JsonFileStore.Load<ExecutionRecord?>(file, () => null);
            if (record is not null)
            {
                records.Add(record);
            }
        }

        return records
            .OrderByDescending(r => r.StartedAt)
            .Take(limit)
            .ToList();
    }

    public ExecutionRecord? Get(string id)
    {
        var path = Path.Combine(_executionsDir, $"{id}.json");
        return JsonFileStore.Load<ExecutionRecord?>(path, () => null);
    }
}
