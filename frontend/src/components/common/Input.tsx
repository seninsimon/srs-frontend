import React from 'react';
import { clsx } from 'clsx';

interface InputProps {
  label?: string;
  error?: string;
  className?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
  name?: string;
  id?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  textarea,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {textarea ? (
        <textarea
          className={clsx(
            'w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            error ? 'border-red-500' : 'border-gray-300',
            className
          )}
          value={props.value}
          onChange={props.onChange as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
          placeholder={props.placeholder}
          required={props.required}
          name={props.name}
          id={props.id}
          disabled={props.disabled}
          autoFocus={props.autoFocus}
        />
      ) : (
        <input
          className={clsx(
            'w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            error ? 'border-red-500' : 'border-gray-300',
            className
          )}
          {...props}
        />
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};