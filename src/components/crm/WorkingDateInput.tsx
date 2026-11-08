import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { dateShortcut, onOrNextWorkingDay } from "@/lib/workingDays";

interface Props {
  id: string;
  value: string;
  onChange: (date: string) => void;
  required?: boolean;
}

export default function WorkingDateInput({ id, value, onChange, required }: Props) {
  const [notice, setNotice] = useState("");
  const choose = (date: string) => {
    const adjusted = date ? onOrNextWorkingDay(date) : "";
    setNotice(adjusted !== date ? `Dzień wolny, termin przesunięto na ${adjusted}.` : "");
    onChange(adjusted);
  };
  return <div className="space-y-2">
    <Input id={id} type="date" value={value} required={required} onChange={(e) => choose(e.target.value)} />
    <div className="flex flex-wrap gap-1">
      {([
        ["tomorrow", "Jutro (roboczy)"], ["two", "Za 2 dni robocze"],
        ["five", "Za 5 dni roboczych"], ["week", "Za tydzień"],
      ] as const).map(([kind, label]) => <Button key={kind} type="button" variant="outline" size="sm" className="h-auto min-h-8 whitespace-normal text-xs" onClick={() => choose(dateShortcut(kind))}>{label}</Button>)}
    </div>
    {notice && <p role="status" className="text-xs text-muted-foreground">{notice}</p>}
  </div>;
}