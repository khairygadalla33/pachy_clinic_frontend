import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variants = {
    default: "border-transparent bg-gray-900 text-gray-50 shadow hover:bg-gray-900/80",
    secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80",
    destructive: "border-transparent bg-red-500 text-white shadow hover:bg-red-500/80",
    outline: "text-gray-950",
    success: "border-transparent bg-green-500 text-white shadow hover:bg-green-500/80",
    warning: "border-transparent bg-amber-500 text-white shadow hover:bg-amber-500/80",
  }
  
  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props} />
  )
}

export { Badge }
