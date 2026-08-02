import * as React from "react";
import { cn } from "@/lib/cn";

/** 管理画面用。シャドウなし・枠線のみ（公開サイトの線に揃える） */
const fieldClassName =
  "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-border-hover disabled:cursor-not-allowed disabled:opacity-50";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(fieldClassName, className)}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input, fieldClassName };
