import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isWithinInterval } from "date-fns";
import { pl } from "date-fns/locale";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Trash2, Users, Palmtree, Clock, Target } from "lucide-react";
import { useTeamCalendar, eventTypeConfig, CalendarEventType, TeamCalendarEvent } from "@/hooks/useTeamCalendar";
import { cn } from "@/lib/utils";

export default function TeamCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TeamCalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "meeting" as CalendarEventType,
    start_date: new Date(),
    end_date: undefined as Date | undefined,
    all_day: true,
    start_time: "",
    end_time: "",
    project_name: "",
  });

  const { events, isLoading, createEvent, updateEvent, deleteEvent, isCreating } = useTeamCalendar();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad to start on Monday
  const startDay = monthStart.getDay();
  const paddingDays = startDay === 0 ? 6 : startDay - 1;
  const previousMonthDays = Array.from({ length: paddingDays }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (paddingDays - i));
    return date;
  });

  const allDays = [...previousMonthDays, ...daysInMonth];
  // Fill remaining days to complete the grid (6 rows x 7 days = 42)
  const remainingDays = 42 - allDays.length;
  const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i + 1);
    return date;
  });
  const calendarDays = [...allDays, ...nextMonthDays];

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const startDate = parseISO(event.start_date);
      const endDate = event.end_date ? parseISO(event.end_date) : startDate;
      return isWithinInterval(day, { start: startDate, end: endDate }) || isSameDay(day, startDate);
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.start_date) return;

    const eventData = {
      title: formData.title,
      description: formData.description || undefined,
      event_type: formData.event_type,
      start_date: format(formData.start_date, "yyyy-MM-dd"),
      end_date: formData.end_date ? format(formData.end_date, "yyyy-MM-dd") : undefined,
      all_day: formData.all_day,
      start_time: !formData.all_day && formData.start_time ? formData.start_time : undefined,
      end_time: !formData.all_day && formData.end_time ? formData.end_time : undefined,
      project_name: formData.project_name || undefined,
      color: eventTypeConfig[formData.event_type].color,
    };

    if (selectedEvent) {
      updateEvent({ id: selectedEvent.id, ...eventData });
    } else {
      createEvent(eventData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_type: "meeting",
      start_date: new Date(),
      end_date: undefined,
      all_day: true,
      start_time: "",
      end_time: "",
      project_name: "",
    });
    setSelectedEvent(null);
    setIsDialogOpen(false);
  };

  const openEventDetails = (event: TeamCalendarEvent) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      start_date: parseISO(event.start_date),
      end_date: event.end_date ? parseISO(event.end_date) : undefined,
      all_day: event.all_day,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      project_name: event.project_name || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
      resetForm();
    }
  };

  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];

  const eventStats = {
    vacations: events.filter((e) => e.event_type === "vacation" && e.status === "confirmed").length,
    deadlines: events.filter((e) => e.event_type === "deadline").length,
    meetings: events.filter((e) => e.event_type === "meeting").length,
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Kalendarz zespołu | FOTZ Studio</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kalendarz zespołu</h1>
            <p className="text-muted-foreground">Urlopy, dostępność i terminy projektów</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Dodaj wydarzenie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedEvent ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tytuł *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nazwa wydarzenia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_type">Typ wydarzenia</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value: CalendarEventType) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(eventTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data rozpoczęcia *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.start_date, "dd.MM.yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.start_date}
                          onSelect={(date) => date && setFormData({ ...formData, start_date: date })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Data zakończenia</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, "dd.MM.yyyy") : "—"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => setFormData({ ...formData, end_date: date })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="all_day"
                    checked={formData.all_day}
                    onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
                  />
                  <Label htmlFor="all_day">Cały dzień</Label>
                </div>

                {!formData.all_day && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Godzina rozpoczęcia</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Godzina zakończenia</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {formData.event_type === "deadline" && (
                  <div className="space-y-2">
                    <Label htmlFor="project_name">Nazwa projektu</Label>
                    <Input
                      id="project_name"
                      value={formData.project_name}
                      onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                      placeholder="Projekt klienta"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Opis</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Dodatkowe informacje..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  {selectedEvent && (
                    <Button variant="destructive" onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Usuń
                    </Button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" onClick={resetForm}>
                      Anuluj
                    </Button>
                    <Button onClick={handleSubmit} disabled={isCreating || !formData.title}>
                      {selectedEvent ? "Zapisz" : "Dodaj"}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Palmtree className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Zaplanowane urlopy</p>
                <p className="text-2xl font-bold">{eventStats.vacations}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <Target className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terminy projektów</p>
                <p className="text-2xl font-bold">{eventStats.deadlines}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spotkania</p>
                <p className="text-2xl font-bold">{eventStats.meetings}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(currentMonth, "LLLL yyyy", { locale: pl })}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                  Dziś
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[100px] p-1 border rounded-md transition-colors",
                      isCurrentMonth ? "bg-background" : "bg-muted/30",
                      isToday && "ring-2 ring-primary"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      !isCurrentMonth && "text-muted-foreground",
                      isToday && "text-primary"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <button
                          key={event.id}
                          onClick={() => openEventDetails(event)}
                          className="w-full text-left"
                        >
                          <Badge
                            variant="secondary"
                            className="w-full justify-start text-xs truncate cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: event.color, color: "#fff" }}
                          >
                            {eventTypeConfig[event.event_type]?.icon} {event.title}
                          </Badge>
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{dayEvents.length - 3} więcej
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              {Object.entries(eventTypeConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-sm">{config.icon} {config.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
