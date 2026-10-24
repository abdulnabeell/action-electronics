"use client";

import { useFormStatus } from "react-dom";

// A submit button that asks "are you sure?" first. Used for every destructive admin action.
// Cancelling the browser dialog stops the form from being submitted; while it is submitting it can't be pressed again.
export default function ConfirmSubmit({ message, className, children, ...rest }: { message: string; className?: string; children: React.ReactNode } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick">) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...rest}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
