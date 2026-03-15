"use client";

import type { ChangeEvent } from "react";

interface Option {
  value: string;
  label: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "number" | "select" | "textarea";
  value: string | number;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  error?: string;
  required?: boolean;
  options?: Option[];
  placeholder?: string;
}

const inputClasses =
  "w-full rounded border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-colors";

const errorInputClasses =
  "border-[var(--color-accent)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]";

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  options = [],
  placeholder,
}: FormFieldProps) {
  const id = `field-${name}`;
  const fieldClasses = `${inputClasses} ${error ? errorInputClasses : ""}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-accent)]">*</span>}
      </label>

      {type === "select" ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={fieldClasses}
        >
          <option value="">{placeholder ?? "Selecione..."}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={4}
          className={fieldClasses}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={fieldClasses}
        />
      )}

      {error && (
        <p className="text-xs text-[var(--color-accent)]">{error}</p>
      )}
    </div>
  );
}
