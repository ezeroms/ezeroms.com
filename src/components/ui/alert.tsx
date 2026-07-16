import * as React from "react";
import { cn } from "@/lib/cn";

const alertVariants = {
  default: "border-border bg-muted text-foreground",
  destructive: "border-red-200 bg-red-50 text-red-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
} as const;

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof alertVariants;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-3.5 py-3 text-sm",
        alertVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
