namespace AutomationAgent.Tests;

/// <summary>A fresh temp directory per test, deleted when the test disposes it.</summary>
public sealed class TestTempDir : IDisposable
{
    public string Path { get; } = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "AutomationAgentTests_" + Guid.NewGuid().ToString("N"));

    public TestTempDir() => Directory.CreateDirectory(Path);

    public string FilePath(string fileName) => System.IO.Path.Combine(Path, fileName);

    public void Dispose()
    {
        if (Directory.Exists(Path))
        {
            Directory.Delete(Path, recursive: true);
        }
    }
}
