const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** True for a 24-hour "HH:mm" value, e.g. "17:00" - mirrors the agent's own check. */
export function isValidTimeOfDay(value: string | null | undefined): boolean {
  return !!value && TIME_OF_DAY_PATTERN.test(value);
}
