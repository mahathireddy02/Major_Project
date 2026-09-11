import { cn, getAvatarColor, getInitials } from '../../lib/utils'

interface AvatarProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
}

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name)
  const colorClass = getAvatarColor(initials)
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-heading font-semibold flex-shrink-0',
        sizes[size],
        colorClass,
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
