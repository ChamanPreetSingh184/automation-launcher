import { Copy, ListChecks, MoreVertical, Pencil, Play, Star, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProfileIcon } from "@/lib/profileIcons";
import type { AutomationProfile } from "@/types/automation";

interface ProfileCardProps {
  profile: AutomationProfile;
  isStartupProfile: boolean;
  isRunning: boolean;
  onOpen: () => void;
  onRun: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetStartup: () => void;
}

export function ProfileCard({
  profile,
  isStartupProfile,
  isRunning,
  onOpen,
  onRun,
  onDuplicate,
  onDelete,
  onSetStartup,
}: ProfileCardProps) {
  const Icon = getProfileIcon(profile.icon);
  const enabledTaskCount = profile.tasks.filter((t) => t.enabled).length;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <button type="button" onClick={onOpen} className="text-left text-sm font-semibold hover:underline">
              {profile.name}
            </button>
            {isStartupProfile && (
              <Badge variant="outline" className="ml-2 border-amber-500/30 bg-amber-500/15 font-normal text-amber-500">
                <Star className="mr-1 h-3 w-3" />
                Startup
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Profile actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>
              <Pencil className="h-4 w-4" /> Open / Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSetStartup} disabled={isStartupProfile}>
              <Star className="h-4 w-4" /> Set as startup profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {profile.description && <p className="line-clamp-2 text-sm text-muted-foreground">{profile.description}</p>}

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" />
          {enabledTaskCount} of {profile.tasks.length} task{profile.tasks.length === 1 ? "" : "s"} enabled
        </span>
        <Button size="sm" onClick={onRun} disabled={isRunning || profile.tasks.length === 0}>
          <Play className="h-3.5 w-3.5" />
          Run Now
        </Button>
      </div>
    </Card>
  );
}
