import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui's open-source button pattern, styled for Invitly (MIT).
export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
  { variants: { variant: { default: "border-primary bg-primary text-primary-foreground hover:bg-primary-hover", outline: "border-border bg-surface text-primary hover:bg-muted-surface", ghost: "border-transparent text-primary hover:bg-muted-surface" }, size: { default: "", sm: "px-3", icon: "size-11 p-0" } }, defaultVariants: { variant: "default", size: "default" } },
);
export function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
