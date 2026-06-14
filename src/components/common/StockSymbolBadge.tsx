import { cn } from '@/lib/utils';

interface StockSymbolBadgeProps {
  symbol: string;
  className?: string;
}

function getSymbolTextSize(symbol: string) {
  const length = symbol.length;

  if (length <= 3) {
    return 'text-2xl';
  }

  if (length === 4) {
    return 'text-xl';
  }

  if (length <= 6) {
    return 'text-lg';
  }

  if (length <= 8) {
    return 'text-base';
  }

  return 'text-sm';
}

export function StockSymbolBadge({ symbol, className }: StockSymbolBadgeProps) {
  const displaySymbol = symbol.trim().toUpperCase() || '--';

  return (
    <div
      className={cn(
        'flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft-strong)] text-[var(--brand-ink)] sm:h-20 sm:w-20',
        className
      )}
    >
      <span
        className={cn(
          'block max-w-full truncate px-1 text-center font-black leading-none tracking-tight',
          getSymbolTextSize(displaySymbol)
        )}
      >
        {displaySymbol}
      </span>
    </div>
  );
}
