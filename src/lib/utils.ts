import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    NEW: "Nowe",
    WAITING_FOR_TECHNICIAN: "Oczekuje na technika",
    DIAGNOSING: "W trakcie diagnozy",
    WAITING_FOR_ACCEPTANCE: "Oczekuje na akceptację",
    WAITING_FOR_PARTS: "Oczekuje na części",
    IN_PROGRESS: "W trakcie naprawy",
    READY_FOR_PICKUP: "Gotowe do odbioru",
    COMPLETED: "Zakończone",
    CANCELLED: "Anulowane",
    ASSIGNED: "Przypisane",
  };
  return map[status] || status;
};
