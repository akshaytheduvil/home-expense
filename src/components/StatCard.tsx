import React from 'react'
import { Card } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  amount: number
  subtitle?: string
  icon?: LucideIcon
  className?: string
  variant?: 'default' | 'hero' | 'emerald'
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  subtitle,
  icon: Icon,
  className,
  variant = 'default',
}) => {
  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 text-white shadow-lg transition-transform hover:scale-[1.01]',
          className
        )}
      >
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <span className="text-9xl font-bold font-mono">₹</span>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium tracking-wide uppercase text-blue-100/90">
              {title}
            </span>
            {Icon && <Icon className="h-5 w-5 text-blue-200" />}
          </div>
          <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight tabular-nums mt-1">
            {formatCurrency(amount)}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-blue-100/80 mt-2 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('p-4 transition-all hover:border-blue-500/40', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {Icon && <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
      </div>
      <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
        {formatCurrency(amount)}
      </div>
      {subtitle && (
        <p className="text-[11px] text-muted-foreground mt-1">
          {subtitle}
        </p>
      )}
    </Card>
  )
}
