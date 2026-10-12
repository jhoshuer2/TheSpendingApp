import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
  suffix?: ReactNode;
  /** A small fixed label before the text, like the ₦ sign. */
  prefix?: string;
}

/** Labelled text field. Label is always visible; error and hint are announced via aria-describedby. */
export function Field({ label, hint, error, suffix, prefix, ...input }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  const message = error ?? hint;
  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__box">
        {prefix && (
          <span className="field__prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          className="field__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? msgId : undefined}
          {...input}
        />
        {suffix && <span className="field__suffix">{suffix}</span>}
      </div>
      {message && (
        <p id={msgId} className="field__msg" role={error ? "alert" : undefined}>
          {message}
        </p>
      )}
    </div>
  );
}
