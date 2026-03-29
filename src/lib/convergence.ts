export type SlotStatus = "optimal" | "possible" | "blocked" | "incomplete";

export type SlotResult = {
  eventDateId: string;
  date: string;
  slot: string;
  availableCount: number;
  flexibleCount: number;
  busyCount: number;
  unansweredCount: number;
  status: SlotStatus;
};

const SLOTS = ["morning", "noon", "afternoon", "evening"] as const;
const SLOT_LABELS: Record<string, string> = {
  morning: "Matin",
  noon: "Midi",
  afternoon: "Après-midi",
  evening: "Soirée",
};

export function computeConvergence(
  dates: { _id: string; date: string }[],
  availabilities: { eventDateId: string; userId: string; slot: string; status: string }[],
  totalMembers: number
): SlotResult[] {
  const results: SlotResult[] = [];
  for (const d of dates) {
    for (const slot of SLOTS) {
      const slotAvails = availabilities.filter(
        (a) => a.eventDateId === d._id && a.slot === slot
      );
      const availableCount = slotAvails.filter((a) => a.status === "available").length;
      const flexibleCount = slotAvails.filter((a) => a.status === "flexible").length;
      const busyCount = slotAvails.filter((a) => a.status === "busy").length;
      const unansweredCount = totalMembers - availableCount - flexibleCount - busyCount;
      let status: SlotStatus;
      if (busyCount > 0) status = "blocked";
      else if (unansweredCount > 0) status = "incomplete";
      else if (availableCount === totalMembers) status = "optimal";
      else status = "possible";
      results.push({
        eventDateId: d._id,
        date: d.date,
        slot,
        availableCount,
        flexibleCount,
        busyCount,
        unansweredCount,
        status,
      });
    }
  }
  return results;
}

export { SLOT_LABELS };
