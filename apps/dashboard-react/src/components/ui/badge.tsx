import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "dash:inline-flex dash:w-fit dash:shrink-0 dash:items-center dash:justify-center dash:gap-1 dash:overflow-hidden dash:rounded-full dash:border dash:border-transparent dash:px-2 dash:py-0.5 dash:text-xs dash:font-medium dash:whitespace-nowrap dash:transition-[color,box-shadow] dash:focus-visible:border-ring dash:focus-visible:ring-[3px] dash:focus-visible:ring-ring/50 dash:aria-invalid:border-destructive dash:aria-invalid:ring-destructive/20 dash:dark:aria-invalid:ring-destructive/40 dash:[&>svg]:pointer-events-none dash:[&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "dash:bg-primary dash:text-primary-foreground dash:[a&]:hover:bg-primary/90",
        secondary:
          "dash:bg-secondary dash:text-secondary-foreground dash:[a&]:hover:bg-secondary/90",
        destructive:
          "dash:bg-destructive dash:text-white dash:focus-visible:ring-destructive/20 dash:dark:bg-destructive/60 dash:dark:focus-visible:ring-destructive/40 dash:[a&]:hover:bg-destructive/90",
        outline:
          "dash:border-border dash:text-foreground dash:[a&]:hover:bg-accent dash:[a&]:hover:text-accent-foreground",
        ghost: "dash:[a&]:hover:bg-accent dash:[a&]:hover:text-accent-foreground",
        link: "dash:text-primary dash:underline-offset-4 dash:[a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
