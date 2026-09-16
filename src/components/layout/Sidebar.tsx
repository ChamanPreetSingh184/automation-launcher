import { History, LayoutDashboard, Rocket, Settings as SettingsIcon, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigationStore, type View } from "@/stores/navigationStore";
import { AgentStatusBadge } from "./AgentStatusBadge";

const NAV_ITEMS: { page: View["page"]; label: string; icon: typeof LayoutDashboard }[] = [
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "profiles", label: "Profiles", icon: Workflow },
  { page: "executions", label: "Execution History", icon: History },
  { page: "settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const view = useNavigationStore((s) => s.view);
  const go = useNavigationStore((s) => s.go);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-card/40 px-3 py-4">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Rocket className="h-4 w-4" />
        </div>
        <span className="font-semibold tracking-tight">Automation Launcher</span>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ page, label, icon: Icon }) => {
          const isActive =
            view.page === page ||
            (page === "profiles" && view.page === "profile-editor") ||
            (page === "executions" && view.page === "execution-detail");
          return (
            <button
              key={page}
              type="button"
              onClick={() => go({ page } as View)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      <AgentStatusBadge />
    </aside>
  );
}
