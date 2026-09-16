using System.Text.Json;

namespace AutomationAgent.Storage;

/// <summary>
/// Generic JSON file read/write. Writes go to a temp file first and are then
/// moved into place, so a crash or failed write mid-way never corrupts the
/// previous valid file. Reads fall back to a caller-supplied default instead
/// of throwing when the file is missing or its contents don't parse.
/// </summary>
public static class JsonFileStore
{
    public static T Load<T>(string path, Func<T> createDefault, Action<string>? onWarning = null)
    {
        if (!File.Exists(path))
        {
            return createDefault();
        }

        try
        {
            var json = File.ReadAllText(path);
            var value = JsonSerializer.Deserialize<T>(json, JsonOptions.Default);
            return value ?? createDefault();
        }
        catch (Exception ex) when (ex is JsonException or IOException)
        {
            onWarning?.Invoke($"Could not read '{path}' ({ex.Message}). Using safe defaults instead.");
            return createDefault();
        }
    }

    public static void SaveAtomic<T>(string path, T value)
    {
        var directory = Path.GetDirectoryName(path)!;
        Directory.CreateDirectory(directory);

        var tempPath = Path.Combine(directory, $".{Path.GetFileName(path)}.{Guid.NewGuid():N}.tmp");
        var json = JsonSerializer.Serialize(value, JsonOptions.Default);
        File.WriteAllText(tempPath, json);
        File.Move(tempPath, path, overwrite: true);
    }
}
