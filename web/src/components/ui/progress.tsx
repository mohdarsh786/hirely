"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, value));
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-slate-900 transition-all duration-300 ease-in-out dark:bg-slate-50"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
