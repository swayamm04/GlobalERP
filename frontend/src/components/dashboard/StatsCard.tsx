import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export const StatsCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
}: StatsCardProps) => {
  const getValueFontSize = (val: string) => {
    if (val.length > 30) return "text-xs";
    if (val.length > 24) return "text-sm";
    if (val.length > 18) return "text-lg";
    return "text-2xl";
  };

  return (
    <Card className="animate-fade-in overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className={cn(
              "font-bold tracking-tight break-all",
              getValueFontSize(value)
            )}>
              {value}
            </p>
            {change && (
              <p
                className={cn(
                  "text-xs sm:text-sm font-medium flex items-center gap-1",
                  changeType === "positive" && "text-success",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {change}
              </p>
            )}
          </div>
          <div className={cn("rounded-lg p-2 sm:p-3 shrink-0", iconColor)}>
            <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
