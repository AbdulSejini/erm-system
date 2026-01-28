'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface AutocompleteOption {
  id: string;
  label: string;
  labelSecondary?: string;
}

export interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (option: AutocompleteOption | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  noResultsText?: string;
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = '',
  label,
  error,
  disabled = false,
  className,
  noResultsText = 'No results found',
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the selected option to display its label
  const selectedOption = options.find(opt => opt.id === value);

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const search = searchTerm.toLowerCase();
    return (
      option.label.toLowerCase().includes(search) ||
      (option.labelSecondary && option.labelSecondary.toLowerCase().includes(search))
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term to selected option's label when closing
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        } else {
          setSearchTerm('');
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  // Set initial search term when value changes
  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
    } else {
      setSearchTerm('');
    }
  }, [value, selectedOption]);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (!e.target.value) {
      onChange(null);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm(''); // Clear to show all options
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    onChange(option);
    setSearchTerm(option.label);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        }
        break;
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] transition-colors',
            'focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--status-error)] focus:border-[var(--status-error)] focus:ring-[var(--status-error)]',
            value && 'pe-8'
          )}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--foreground-muted)]">
              {noResultsText}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm transition-colors',
                  index === highlightedIndex && 'bg-[var(--primary)] bg-opacity-10',
                  option.id === value && 'bg-[var(--primary)] bg-opacity-20 font-medium',
                  'hover:bg-[var(--primary)] hover:bg-opacity-10'
                )}
              >
                <div className="text-[var(--foreground)]">{option.label}</div>
                {option.labelSecondary && (
                  <div className="text-xs text-[var(--foreground-muted)]">
                    {option.labelSecondary}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-[var(--status-error)]">{error}</p>
      )}
    </div>
  );
}
