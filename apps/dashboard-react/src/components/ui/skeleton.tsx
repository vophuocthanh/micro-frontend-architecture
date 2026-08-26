import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("dash:animate-pulse dash:rounded-md dash:bg-accent", className)}
      {...props}
    />
  )
}

export { Skeleton }
