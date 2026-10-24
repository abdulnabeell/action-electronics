"use client";

import { useFormStatus } from "react-dom";

// A submit button that disables itself while its form is being saved, so a double click can't submit twice.
export default function SubmitButton({ children, pendingText = "Saving…", className = "btn-primary", ...rest }: { children: React.ReactNode; pendingText?: string; className?: string } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} {...rest}>
      {pending ? pendingText : children}
    </button>
  );
}
