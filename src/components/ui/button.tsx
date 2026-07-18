import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * shadcn/ui 標準ボタンをベースに、管理画面向けへアレンジ
 * （白地・枠線・シャドウなし / フォーカスは border-hover）
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer appearance-none items-center justify-center gap-2 whitespace-nowrap rounded-md border border-solid text-sm font-medium shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-hover focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default disabled:pointer-events-none disabled:opacity-50 disabled:hover:border-[inherit] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-border bg-card text-foreground hover:border-border-hover hover:bg-card disabled:hover:border-border",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:border-border-hover hover:bg-secondary disabled:hover:border-border",
        outline:
          "border-border bg-card text-foreground hover:border-border-hover hover:bg-card disabled:hover:border-border",
        ghost:
          "border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground",
        link: "border-transparent bg-transparent text-foreground underline-offset-4 hover:underline",
        destructive:
          "border-red-200 bg-card text-red-600 hover:border-red-500 hover:bg-card focus-visible:ring-red-500 disabled:hover:border-red-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
