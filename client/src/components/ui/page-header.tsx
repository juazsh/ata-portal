import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {title}
            </h1>
            {badge && (
              <Badge variant={badge.variant || "secondary"} className="text-xs">
                {badge.text}
              </Badge>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {children && <div className="flex gap-2">{children}</div>}
      </div>
      <Separator className="mt-4" />
    </div>
  );
}