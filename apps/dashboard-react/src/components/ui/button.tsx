import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "dash:inline-flex dash:shrink-0 dash:items-center dash:justify-center dash:gap-2 dash:rounded-md dash:text-sm dash:font-medium dash:whitespace-nowrap dash:transition-all dash:outline-none dash:focus-visible:border-ring dash:focus-visible:ring-[3px] dash:focus-visible:ring-ring/50 dash:disabled:pointer-events-none dash:disabled:opacity-50 dash:aria-invalid:border-destructive dash:aria-invalid:ring-destructive/20 dash:dark:aria-invalid:ring-destructive/40 dash:[&_svg]:pointer-events-none dash:[&_svg]:shrink-0 dash:[&_svg:not([class*=size-])]:size-4",
  {
    variants: {
      variant: {
        default: "dash:bg-primary dash:text-primary-foreground dash:hover:bg-primary/90",
        destructive:
          "dash:bg-destructive dash:text-white dash:hover:bg-destructive/90 dash:focus-visible:ring-destructive/20 dash:dark:bg-destructive/60 dash:dark:focus-visible:ring-destructive/40",
        outline:
          "dash:border dash:bg-background dash:shadow-xs dash:hover:bg-accent dash:hover:text-accent-foreground dash:dark:border-input dash:dark:bg-input/30 dash:dark:hover:bg-input/50",
        secondary:
          "dash:bg-secondary dash:text-secondary-foreground dash:hover:bg-secondary/80",
        ghost:
          "dash:hover:bg-accent dash:hover:text-accent-foreground dash:dark:hover:bg-accent/50",
        link: "dash:text-primary dash:underline-offset-4 dash:hover:underline",
      },
      size: {
        default: "dash:h-9 dash:px-4 dash:py-2 dash:has-[>svg]:px-3",
        xs: "dash:h-6 dash:gap-1 dash:rounded-md dash:px-2 dash:text-xs dash:has-[>svg]:px-1.5 dash:[&_svg:not([class*=size-])]:size-3",
        sm: "dash:h-8 dash:gap-1.5 dash:rounded-md dash:px-3 dash:has-[>svg]:px-2.5",
        lg: "dash:h-10 dash:rounded-md dash:px-6 dash:has-[>svg]:px-4",
        icon: "dash:size-9",
        "icon-xs": "dash:size-6 dash:rounded-md dash:[&_svg:not([class*=size-])]:size-3",
        "icon-sm": "dash:size-8",
        "icon-lg": "dash:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
