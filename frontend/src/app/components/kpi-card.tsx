import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  context?: string;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
  status?: "default" | "success" | "warning" | "error";
}

export function KPICard({ label, value, context, trend, status = "default" }: KPICardProps) {
  const statusColors = {
    default: "text-[#111827]",
    success: "text-[#1F6F43]",
    warning: "text-[#A16207]",
    error: "text-[#B42318]",
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 hover:shadow-sm transition-shadow">
      <p className="text-[#5B6472] text-[13px] font-medium mb-3">{label}</p>
      
      <div className="flex items-baseline gap-3 mb-2">
        <h3 className={`text-[32px] font-semibold tracking-tight ${statusColors[status]}`}>
          {value}
        </h3>
        
        {trend && (
          <div className={`flex items-center gap-1 ${
            trend.direction === "up" ? "text-[#1F6F43]" : "text-[#B42318]"
          }`}>
            {trend.direction === "up" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{trend.value}</span>
          </div>
        )}
      </div>
      
      {context && (
        <p className="text-[#5B6472] text-sm">{context}</p>
      )}
    </div>
  );
}
