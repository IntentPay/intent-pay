import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-[#191d3e] to-[#232853]", 
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
