import { MagnifyingGlass } from 'phosphor-react';
import { cn } from '@/lib/utils';
import { inputs } from '@/lib/design-system';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Reusable search input component with consistent styling and icon.
 * Provides a standard interface for search functionality across pages.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" weight="bold" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputs.searchInput}
      />
    </div>
  );
}
