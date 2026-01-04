import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Deal, Lead, useCRM } from "@/hooks/useCRM";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface DealsKanbanProps {
  deals: Deal[];
  leads: Lead[];
  isLoading: boolean;
}

const stages = [
  { id: "qualification", label: "Kwalifikacja", color: "bg-blue-500" },
  { id: "proposal", label: "Propozycja", color: "bg-yellow-500" },
  { id: "negotiation", label: "Negocjacje", color: "bg-orange-500" },
  { id: "closed_won", label: "Wygrane", color: "bg-green-500" },
  { id: "closed_lost", label: "Przegrane", color: "bg-red-500" },
];

const DealsKanban = ({ deals, leads, isLoading }: DealsKanbanProps) => {
  const { updateDeal } = useCRM();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getLeadName = (leadId: string | null) => {
    if (!leadId) return null;
    const lead = leads.find((l) => l.id === leadId);
    return lead?.name || null;
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const dealId = result.draggableId;
    const newStage = result.destination.droppableId;
    
    updateDeal.mutate({ id: dealId, stage: newStage });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {stages.map((stage) => (
          <div key={stage.id} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <div key={stage.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <span className="font-medium">{stage.label}</span>
                  <Badge variant="secondary">{stageDeals.length}</Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {formatCurrency(stageValue)}
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? "bg-muted" : "bg-muted/30"
                    }`}
                  >
                    {stageDeals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-grab ${
                              snapshot.isDragging ? "shadow-lg rotate-2" : ""
                            }`}
                          >
                            <CardContent className="p-3">
                              <h4 className="font-medium text-sm">{deal.title}</h4>
                              {getLeadName(deal.lead_id) && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {getLeadName(deal.lead_id)}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-semibold">
                                  {formatCurrency(deal.value)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {deal.probability}%
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default DealsKanban;
