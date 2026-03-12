/**
 * Merges class names, filtering out falsy values.
 * Lightweight alternative to clsx + tailwind-merge when those packages are unavailable.
 */
export function cn(
  ...classes: (string | undefined | null | false | 0)[]
): string {
  return classes.filter(Boolean).join(" ");
}
