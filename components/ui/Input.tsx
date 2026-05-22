import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

// ============================================================
// Types
// ============================================================

interface BaseInputProps {
  /** Optional label above the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Help text below the input */
  helpText?: string;
  /** Size variant - matches Select component */
  size?: "sm" | "md" | "lg";
  /** Show required indicator (only with label) */
  required?: boolean;
}

type TextInputProps = BaseInputProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    as?: "input";
  };

type TextareaProps = BaseInputProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & {
    as: "textarea";
  };

type InputProps = TextInputProps | TextareaProps;

// ============================================================
// Size classes - matched to Select component
// ============================================================

const sizeClasses = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-4 py-3 text-lg",
};

// ============================================================
// Component
// ============================================================

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, error, helpText, size = "md", className = "", ...props }, ref) => {
    const id = props.id || props.name || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const isTextarea = props.as === "textarea";

    const inputClasses = [
      "w-full rounded-lg border bg-white",
      "placeholder:text-gray-400",
      "transition-colors duration-200",
      "focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400",
      sizeClasses[size],
      error
        ? "border-red-300"
        : "border-gray-200 hover:border-gray-300",
      props.disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Remove 'as' and 'size' from props before spreading
    const { as: _as, required, ...restProps } = props as TextareaProps & { required?: boolean };
    void _as;

    const inputElement = isTextarea ? (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        id={id}
        className={inputClasses}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        {...(restProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    ) : (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        id={id}
        className={inputClasses}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        {...(restProps as InputHTMLAttributes<HTMLInputElement>)}
      />
    );

    // If no label, render just the input (compact mode)
    if (!label) {
      return error ? (
        <div>
          {inputElement}
          <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        </div>
      ) : inputElement;
    }

    // Full mode with label
    return (
      <div>
        <label
          htmlFor={id}
          className="block text-[13px] font-semibold text-gray-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>

        {inputElement}

        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {helpText && !error && (
          <p id={`${id}-help`} className="mt-1.5 text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
