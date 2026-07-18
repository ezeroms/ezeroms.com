import * as React from "react";
import { cn } from "@/lib/cn";
import { fieldClassName } from "@/components/ui/input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      fieldClassName,
      "h-auto min-h-[120px] resize-y leading-relaxed",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
