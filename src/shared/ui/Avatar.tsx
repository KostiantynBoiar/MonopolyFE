import { cn } from '@/shared/lib/cn';

type AvatarProps = {
  name: string;
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue text-[11px] font-semibold text-white select-none',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
