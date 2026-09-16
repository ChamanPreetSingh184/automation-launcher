using AutomationAgent.Logging;
using AutomationAgent.Models;
using AutomationAgent.Services;

namespace AutomationAgent.Tests.Services;

public class ProfileManagerTests
{
    private static (ProfileManager Manager, ConfigurationStore Store) CreateManager(TestTempDir dir) =>
        CreateManagerWithStore(dir);

    private static (ProfileManager Manager, ConfigurationStore Store) CreateManagerWithStore(TestTempDir dir)
    {
        var store = new ConfigurationStore(new AutomationLogger(), dir.FilePath("profiles.json"), dir.FilePath("settings.json"));
        return (new ProfileManager(store), store);
    }

    [Fact]
    public void Save_NewProfile_AssignsIdAndTimestampsAndPersistsIt()
    {
        using var dir = new TestTempDir();
        var (manager, _) = CreateManager(dir);

        var saved = manager.Save(new AutomationProfile { Name = "My Profile" });

        Assert.False(string.IsNullOrEmpty(saved.Id));
        Assert.Single(manager.List());
        Assert.Equal("My Profile", manager.Get(saved.Id)!.Name);
    }

    [Fact]
    public void Save_ExistingProfile_UpdatesInPlaceAndKeepsOriginalCreatedAt()
    {
        using var dir = new TestTempDir();
        var (manager, _) = CreateManager(dir);

        var created = manager.Save(new AutomationProfile { Name = "Original" });
        var originalCreatedAt = created.CreatedAt;

        created.Name = "Renamed";
        manager.Save(created);

        var all = manager.List();
        Assert.Single(all);
        Assert.Equal("Renamed", all[0].Name);
        Assert.Equal(originalCreatedAt, all[0].CreatedAt);
    }

    [Fact]
    public void Save_AssignsSequentialOrderToTasksMatchingListPosition()
    {
        using var dir = new TestTempDir();
        var (manager, _) = CreateManager(dir);

        var profile = new AutomationProfile
        {
            Name = "Ordered",
            Tasks =
            [
                new AutomationTask { Name = "First", Type = TaskType.Wait },
                new AutomationTask { Name = "Second", Type = TaskType.Wait },
            ],
        };

        var saved = manager.Save(profile);

        Assert.Equal(0, saved.Tasks[0].Order);
        Assert.Equal(1, saved.Tasks[1].Order);
    }

    [Fact]
    public void Delete_RemovesProfileAndClearsItAsStartupProfile()
    {
        using var dir = new TestTempDir();
        var (manager, store) = CreateManager(dir);

        var profile = manager.Save(new AutomationProfile { Name = "Startup Candidate" });
        store.SaveSettings(new AppSettings { StartupAutomationEnabled = true, StartupProfileId = profile.Id });

        var deleted = manager.Delete(profile.Id);

        Assert.True(deleted);
        Assert.Null(manager.Get(profile.Id));
        var settings = store.LoadSettings();
        Assert.Null(settings.StartupProfileId);
        Assert.False(settings.StartupAutomationEnabled);
    }

    [Fact]
    public void Delete_UnknownId_ReturnsFalse()
    {
        using var dir = new TestTempDir();
        var (manager, _) = CreateManager(dir);

        Assert.False(manager.Delete("does-not-exist"));
    }

    [Fact]
    public void Duplicate_CreatesCopyWithNewIdsAndSuffixedName()
    {
        using var dir = new TestTempDir();
        var (manager, _) = CreateManager(dir);

        var original = manager.Save(new AutomationProfile
        {
            Name = "Original",
            Tasks = [new AutomationTask { Name = "Step", Type = TaskType.Wait, DelaySeconds = 3 }],
        });

        var copy = manager.Duplicate(original.Id);

        Assert.NotEqual(original.Id, copy.Id);
        Assert.Equal("Original (Copy)", copy.Name);
        Assert.NotEqual(original.Tasks[0].Id, copy.Tasks[0].Id);
        Assert.Equal(2, manager.List().Count);
    }
}
