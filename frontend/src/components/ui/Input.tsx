import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const baseField =
  'w-full rounded-field border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-faint transition-colors duration-150 focus:border-accent focus:shadow-focus focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint'

export interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
}

/** Labelled form field wrapper with hint + error states */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label className="block text-[0.8125rem] font-medium text-ink">
          {label}
          {required ? <span className="ml-0.5 text-danger">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(baseField, 'h-9.5', invalid && 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(180,35,24,0.15)]', className)}
        {...props}
      />
    )
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(baseField, 'min-h-[88px] py-2', invalid && 'border-danger focus:shadow-[0_0_0_3px_rgba(180,35,24,0.15)]', className)}
        {...props}
      />
    )
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(baseField, 'h-9.5 appearance-none bg-no-repeat pr-9', invalid && 'border-danger focus:shadow-[0_0_0_3px_rgba(180,35,24,0.15)]', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238891A1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
          backgroundPosition: 'right 0.625rem center',
        }}
        {...props}
      >
        {children}
      </select>
    )
  },
)

/** Inline switch control — used for toggles in settings */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
        {description ? <p className="mt-0.5 text-xs text-ink-faint">{description}</p> : null}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === 'string' ? label : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5.5 w-10 shrink-0 rounded-full transition-colors duration-150 focus-visible:shadow-focus',
          checked ? 'bg-accent' : 'bg-line-strong',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform duration-150',
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}