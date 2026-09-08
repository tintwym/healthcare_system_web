import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type McSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type McSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: McSelectOption[];
  className?: string;
  menuClassName?: string;
  placeholder?: string;
  'aria-label'?: string;
  disabled?: boolean;
  /** default = bordered control; ghost = transparent chip-style */
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'md';
};

export const McSelect: React.FC<McSelectProps> = ({
  id,
  value,
  onChange,
  options,
  className = '',
  menuClassName = '',
  placeholder = 'Select…',
  'aria-label': ariaLabel,
  disabled = false,
  variant = 'default',
  size = 'sm',
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const triggerId = id ?? autoId;
  const listId = `${triggerId}-listbox`;

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const sizeClasses =
    size === 'md' ? 'pl-3 pr-2.5 py-2 text-sm' : 'pl-2.5 pr-2 py-1.5 text-xs';

  const triggerClasses =
    variant === 'ghost'
      ? `inline-flex items-center gap-1.5 min-w-0 max-w-full font-bold text-slate-800 dark:text-slate-100 bg-transparent border-0 shadow-none hover:bg-slate-100/70 dark:hover:bg-slate-800/60 rounded-md ${sizeClasses}`
      : `w-full flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-400 dark:hover:border-slate-500 ${sizeClasses}`;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`${triggerClasses} focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={triggerId}
            className={`absolute left-0 z-50 mt-1.5 min-w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-1.5 shadow-xl ${menuClassName}`}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li key={opt.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return;
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full grid grid-cols-[1.25rem_1fr] items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors disabled:opacity-40 ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-100 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center">
                      {isSelected ? (
                        <Check
                          className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400"
                          aria-hidden
                        />
                      ) : null}
                    </span>
                    <span className="leading-snug">{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};
