import { cn } from '@/shared/lib/cn';

export type IconName =
  | 'activity'
  | 'lock'
  | 'chat'
  | 'arrow'
  | 'menu'
  | 'close'
  | 'sun'
  | 'moon';

type IconProps = {
  name: IconName;
  className?: string;
};

export function Icon({ name, className }: IconProps) {
  return (
    <svg className={cn('ic', className)} aria-hidden="true">
      <use href={`#icon-${name}`} />
    </svg>
  );
}
