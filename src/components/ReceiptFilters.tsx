import { useState, useRef } from 'react';
import { Search, SlidersHorizontal, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { RECEIPT_CATEGORIES } from '@/lib/categories';

export interface ReceiptFilterValues {
  search: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin: string;
  amountMax: string;
  category: string;
}

interface ReceiptFiltersProps {
  filters: ReceiptFilterValues;
  onChange: (filters: ReceiptFilterValues) => void;
  storeNames?: string[];
}

export const emptyFilters: ReceiptFilterValues = {
  search: '',
  dateFrom: undefined,
  dateTo: undefined,
  amountMin: '',
  amountMax: '',
  category: '',
};

export function ReceiptFilters({ filters, onChange, storeNames = [] }: ReceiptFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters =
    filters.search || filters.dateFrom || filters.dateTo || filters.amountMin || filters.amountMax || filters.category;

  const update = (partial: Partial<ReceiptFilterValues>) =>
    onChange({ ...filters, ...partial });

  const suggestions = filters.search.length > 0
    ? storeNames.filter((name) =>
        name.toLowerCase().includes(filters.search.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search by store name..."
            value={filters.search}
            onChange={(e) => {
              update({ search: e.target.value });
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="pl-9"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((name, i) => {
                const idx = name.toLowerCase().indexOf(filters.search.toLowerCase());
                const before = name.slice(0, idx);
                const match = name.slice(idx, idx + filters.search.length);
                const after = name.slice(idx + filters.search.length);
                return (
                  <button
                    key={`${name}-${i}`}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      update({ search: name });
                      setShowSuggestions(false);
                    }}
                  >
                    <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span>
                      {before}<span className="font-semibold text-primary">{match}</span>{after}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <Button
          variant={showAdvanced ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex-shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { onChange(emptyFilters); setShowAdvanced(false); }}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-card">
          {/* Date From */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal text-sm h-9',
                  !filters.dateFrom && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {filters.dateFrom ? format(filters.dateFrom, 'MMM d, yyyy') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom}
                onSelect={(d) => update({ dateFrom: d || undefined })}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Date To */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal text-sm h-9',
                  !filters.dateTo && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {filters.dateTo ? format(filters.dateTo, 'MMM d, yyyy') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo}
                onSelect={(d) => update({ dateTo: d || undefined })}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Amount range */}
          <Input
            placeholder="Min amount (E)"
            type="number"
            step="0.01"
            value={filters.amountMin}
            onChange={(e) => update({ amountMin: e.target.value })}
            className="h-9 text-sm"
          />
          <Input
            placeholder="Max amount (E)"
            type="number"
            step="0.01"
            value={filters.amountMax}
            onChange={(e) => update({ amountMax: e.target.value })}
            className="h-9 text-sm"
          />

          {/* Category filter */}
          <Select value={filters.category} onValueChange={(v) => update({ category: v === 'all' ? '' : v })}>
            <SelectTrigger className="h-9 text-sm col-span-2">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {RECEIPT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${cat.color} border ${cat.textColor.replace('text-', 'border-')}`} />
                    {cat.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
