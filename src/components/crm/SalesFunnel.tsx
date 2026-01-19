import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface Lead {
  id: string;
  status: string;
}

interface Deal {
  id: string;
  stage: string;
}

interface SalesFunnelProps {
  leads: Lead[];
  deals: Deal[];
}

const LEAD_STAGES = [
  { key: "new", label: "Nowy", color: "bg-blue-500" },
  { key: "contacted", label: "Kontakt", color: "bg-indigo-500" },
  { key: "qualified", label: "Kwalifikacja", color: "bg-purple-500" },
  { key: "proposal", label: "Oferta", color: "bg-pink-500" },
  { key: "negotiation", label: "Negocjacje", color: "bg-orange-500" },
  { key: "won", label: "Wygrane", color: "bg-green-500" },
];

const SalesFunnel = ({ leads, deals }: SalesFunnelProps) => {
  const funnelData = useMemo(() => {
    const leadCounts: Record<string, number> = {};
    const dealCounts: Record<string, number> = {};

    // Count leads by status
    leads.forEach((lead) => {
      leadCounts[lead.status] = (leadCounts[lead.status] || 0) + 1;
    });

    // Count deals by stage
    deals.forEach((deal) => {
      dealCounts[deal.stage] = (dealCounts[deal.stage] || 0) + 1;
    });

    // Map to funnel stages
    return LEAD_STAGES.map((stage, index) => {
      const count = leadCounts[stage.key] || dealCounts[stage.key] || 0;
      return {
        ...stage,
        count,
        index,
      };
    });
  }, [leads, deals]);

  const totalLeads = leads.length + deals.length;
  const wonDeals = funnelData.find((s) => s.key === "won")?.count || 0;
  const conversionRate = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : "0";

  // Calculate max count for scaling
  const maxCount = Math.max(...funnelData.map((s) => s.count), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Lejek sprzedaży
        </CardTitle>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{conversionRate}%</p>
          <p className="text-xs text-muted-foreground">Konwersja</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {funnelData.map((stage, index) => {
          // Calculate width based on funnel shape (wider at top, narrower at bottom)
          const baseWidth = 100 - index * 10;
          const fillWidth = stage.count > 0 ? Math.max((stage.count / maxCount) * baseWidth, 20) : 0;
          
          return (
            <div key={stage.key} className="relative">
              {/* Stage label */}
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{stage.label}</span>
                <span className="text-sm font-bold">{stage.count}</span>
              </div>
              
              {/* Funnel bar */}
              <div 
                className="relative h-8 bg-muted/50 rounded-md overflow-hidden mx-auto transition-all"
                style={{ width: `${baseWidth}%` }}
              >
                <div
                  className={`absolute inset-y-0 left-0 ${stage.color} rounded-md transition-all duration-500 flex items-center justify-center`}
                  style={{ width: stage.count > 0 ? `${(stage.count / maxCount) * 100}%` : '0%' }}
                >
                  {stage.count > 0 && (
                    <span className="text-white text-xs font-semibold drop-shadow">
                      {stage.count}
                    </span>
                  )}
                </div>
              </div>

              {/* Conversion arrow between stages */}
              {index < funnelData.length - 1 && funnelData[index].count > 0 && (
                <div className="flex justify-center my-1">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground/30" />
                </div>
              )}
            </div>
          );
        })}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t mt-4">
          <div className="text-center">
            <p className="text-lg font-bold">{leads.length}</p>
            <p className="text-xs text-muted-foreground">Leady</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{deals.length}</p>
            <p className="text-xs text-muted-foreground">Deale</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{wonDeals}</p>
            <p className="text-xs text-muted-foreground">Wygrane</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesFunnel;
