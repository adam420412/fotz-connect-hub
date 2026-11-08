import { addWorkingDays, nextWorkingDay, onOrNextWorkingDay, warsawToday } from "./workingDays";

export type ContactResult = "no_answer" | "meeting" | "offer" | "callback" | "lost";
export const contactResults: Record<ContactResult, string> = {
  no_answer: "Nie odbiera", meeting: "Umówione spotkanie", offer: "Wysłana oferta",
  callback: "Oddzwonić w terminie", lost: "Niezainteresowany",
};

export function contactNextStep(result: ContactResult, selectedDate: string, today = warsawToday()) {
  if (result === "lost") return { next_step: null, next_step_date: null };
  if (result === "no_answer") return { next_step: "Zadzwonić ponownie", next_step_date: nextWorkingDay(today) };
  if (result === "offer") return { next_step: "Follow-up oferty", next_step_date: addWorkingDays(today, 5) };
  if (!selectedDate) throw new Error("Wybierz datę następnego kontaktu.");
  return {
    next_step: result === "meeting" ? "Spotkanie" : "Oddzwonić",
    next_step_date: onOrNextWorkingDay(selectedDate),
  };
}