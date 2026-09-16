import {
  Briefcase,
  Code2,
  Gamepad2,
  Home,
  Rocket,
  Sparkles,
  Sunrise,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const PROFILE_ICONS: Record<string, LucideIcon> = {
  rocket: Rocket,
  briefcase: Briefcase,
  code: Code2,
  home: Home,
  sunrise: Sunrise,
  zap: Zap,
  gamepad: Gamepad2,
  sparkles: Sparkles,
};

export function getProfileIcon(name: string): LucideIcon {
  return PROFILE_ICONS[name] ?? Rocket;
}
