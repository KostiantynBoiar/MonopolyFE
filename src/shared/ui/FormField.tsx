import type { InputHTMLAttributes } from 'react';
import { Input } from './Input';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  /** Validation message; when set the input renders in its error state. */
  error?: string;
}

/** A labelled text input with an inline validation message — the standard form row. */
export function FormField({ id, label, error, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <Input id={id} error={!!error} {...inputProps} />
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}
