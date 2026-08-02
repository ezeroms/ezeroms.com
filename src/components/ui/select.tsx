import * as React from "react";
import { cn } from "@/lib/cn";
import { fieldClassName } from "@/components/ui/input";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => (
  <select
    className={cn(fieldClassName, className)}
    ref={ref}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
