using AutomationAgent.Storage;

namespace AutomationAgent.Tests.Storage;

public class JsonFileStoreTests
{
    private record SampleData(string Name, int Count);

    [Fact]
    public void Load_MissingFile_ReturnsDefaultWithoutThrowing()
    {
        using var dir = new TestTempDir();
        var path = dir.FilePath("missing.json");

        var result = JsonFileStore.Load(path, () => new SampleData("default", 0));

        Assert.Equal("default", result.Name);
    }

    [Fact]
    public void SaveAtomic_ThenLoad_RoundTripsTheSameData()
    {
        using var dir = new TestTempDir();
        var path = dir.FilePath("data.json");

        JsonFileStore.SaveAtomic(path, new SampleData("hello", 42));
        var result = JsonFileStore.Load(path, () => new SampleData("default", 0));

        Assert.Equal("hello", result.Name);
        Assert.Equal(42, result.Count);
    }

    [Fact]
    public void Load_CorruptFile_FallsBackToDefaultAndReportsWarning()
    {
        using var dir = new TestTempDir();
        var path = dir.FilePath("corrupt.json");
        File.WriteAllText(path, "{ this is not valid json ");

        string? warning = null;
        var result = JsonFileStore.Load(path, () => new SampleData("default", 0), msg => warning = msg);

        Assert.Equal("default", result.Name);
        Assert.NotNull(warning);
    }

    [Fact]
    public void SaveAtomic_OverwritingExistingFile_LeavesPreviousValidDataUnlessNewWriteSucceeds()
    {
        using var dir = new TestTempDir();
        var path = dir.FilePath("data.json");

        JsonFileStore.SaveAtomic(path, new SampleData("first", 1));
        JsonFileStore.SaveAtomic(path, new SampleData("second", 2));

        var result = JsonFileStore.Load(path, () => new SampleData("default", 0));
        Assert.Equal("second", result.Name);
        Assert.Equal(2, result.Count);

        // No leftover temp files from the atomic write should remain.
        Assert.DoesNotContain(Directory.GetFiles(dir.Path), f => f.Contains(".tmp"));
    }
}
