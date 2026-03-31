"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { getLocalUser } from "@/lib/user";
import { useRouter } from "next/navigation";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { computeConvergence, SLOT_LABELS } from "@/lib/convergence";

type Slot = "morning" | "noon" | "afternoon" | "evening";
type Status = "available" | "flexible" | "busy" | null;

const SLOTS: { id: Slot; label: string }[] = [
  { id: "morning", label: "Matin" },
  { id: "noon", label: "Midi" },
  { id: "afternoon", label: "Après-midi" },
  { id: "evening", label: "Soirée" },
];

export default function EventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = use(params);
  const router = useRouter();

  const [localUser, setUser] = useState<ReturnType<typeof getLocalUser>>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const u = getLocalUser();
    setUser(u);
    setIsLoaded(true);
    if (!u) router.push("/");
  }, [router]);

  const events = useQuery(api.events.getEvents, { groupId: id as Id<"groups"> });
  const event = events?.find((e) => e._id === eventId);
  const availData = useQuery(api.availabilities.getAvailabilitiesForEvent, { eventId: eventId as Id<"events"> });
  const members = useQuery(api.groups.getGroupMembers, { groupId: id as Id<"groups"> });

  const upsertAvailability = useMutation(api.availabilities.upsertAvailability);
  const deleteAvailability = useMutation(api.availabilities.deleteAvailability);

  const convergenceResults = useMemo(() => {
    if (!availData || !members) return [];
    return computeConvergence(availData.dates, availData.availabilities, members.length);
  }, [availData, members]);

  const optimalSlots = convergenceResults.filter((r: any) => r.status === "optimal");

  if (!isLoaded || !localUser) return null;

  if (events === undefined || availData === undefined || members === undefined) {
    return null;
  }

  if (!event) {
    return (
      <main className="max-w-[430px] mx-auto min-h-screen bg-[#F7F6F3] p-6 flex items-center justify-center">
        <p className="text-[#888580] text-[14px]">Sortie introuvable</p>
      </main>
    );
  }

  const { dates, availabilities } = availData;

  const handleSlotClick = async (eventDateId: Id<"eventDates">, slot: Slot, currentStatus: Status) => {
    const cycle: Status[] = [null, "available", "flexible", "busy"];
    const currentIndex = cycle.indexOf(currentStatus);
    const nextStatus = cycle[(currentIndex + 1) % cycle.length];

    try {
      if (nextStatus === null) {
        await deleteAvailability({ eventDateId, slot, userId: localUser.userId });
      } else {
        await upsertAvailability({ eventDateId, slot, status: nextStatus, userId: localUser.userId });
      }
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusStyles = (status: Status) => {
    switch (status) {
      case "available":
        return "bg-[#F0FAF6] text-[#1D9E75] border-transparent";
      case "flexible":
        return "bg-[#FFFBEB] text-[#D97706] border-transparent";
      case "busy":
        return "bg-[#FEF2F2] text-[#DC2626] border-transparent";
      default:
        return "bg-white text-[#888580] border-[#E8E6E1]";
    }
  };

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case "available": return "Dispo";
      case "flexible": return "Flexible";
      case "busy": return "Occupé";
      default: return "À remplir";
    }
  };

  const getDotColor = (status: string) => {
    switch (status) {
      case "available": return "bg-[#1D9E75]";
      case "flexible": return "bg-[#D97706]";
      case "busy": return "bg-[#DC2626]";
      default: return "bg-[#E8E6E1]";
    }
  };

  return (
    <main className="max-w-[430px] mx-auto min-h-screen bg-[#F7F6F3] p-6 pt-8 pb-24 relative">
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="text-[20px] text-[#534AB7] font-medium"
        >
          ←
        </button>

        <h1 className="flex-1 text-[18px] font-bold text-[#1A1714] truncate">{event.title}</h1>
        
        <span className={`text-[11px] font-semibold px-[10px] py-[3px] rounded-full ${
          event.status === 'open' ? 'bg-[#F3F2FF] text-[#534AB7]' :
          event.status === 'confirmed' ? 'bg-[#F0FAF6] text-[#1D9E75]' :
          'bg-[#FEF2F2] text-[#DC2626]'
        }`}>
          {event.status === 'open' ? 'Ouvert' :
           event.status === 'confirmed' ? 'Confirmé' : 'Annulé'}
        </span>
      </header>

      {optimalSlots.length > 0 && (
        <div className="bg-[#534AB7] rounded-[10px] p-[12px_14px] mb-8">
          <span className="block text-[11px] font-semibold text-[#AFA9EC] uppercase tracking-wider mb-2">
            ✦ Prochaine convergence
          </span>
          <div className="space-y-1">
            {optimalSlots.map((s: any) => (
              <div key={s.eventDateId + s.slot} className="text-[15px] font-bold text-white">
                {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · {SLOT_LABELS[s.slot]}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {dates.map((dateObj) => {
          const dateStr = new Date(dateObj.date).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });

          return (
            <div key={dateObj._id} className="bg-white border border-[#E8E6E1] rounded-[12px] p-[14px_16px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F7F6F3]">
                <h2 className="text-[13px] font-bold text-[#1A1714] capitalize">
                  {dateStr}
                </h2>
                <div className="flex -space-x-1">
                   {members.slice(0, 3).map(m => (
                     <div key={m._id} className="w-5 h-5 rounded-full bg-[#F7F6F3] border border-white flex items-center justify-center text-[10px]">
                       {m.avatarEmoji}
                     </div>
                   ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[6px]">
                {SLOTS.map((slot) => {
                  const slotAvails = availabilities.filter(
                    (a) => a.eventDateId === dateObj._id && a.slot === slot.id
                  );
                  const myAvail = slotAvails.find((a) => a.userId === localUser.userId);
                  const currentStatus = myAvail ? (myAvail.status as Status) : null;
                  const otherAvails = slotAvails.filter(a => a.userId !== localUser.userId);

                  return (
                    <div key={slot.id} className="flex flex-col gap-2">
                      <button
                        onClick={() => handleSlotClick(dateObj._id, slot.id, currentStatus)}
                        className={`p-[10px] rounded-[8px] border transition-all text-center ${getStatusStyles(currentStatus)}`}
                      >
                        <span className="block text-[9px] font-semibold uppercase tracking-[0.4px] mb-0.5">{slot.label}</span>
                        <span className="text-[12px] font-medium">{getStatusLabel(currentStatus)}</span>
                      </button>
                      
                      {otherAvails.length > 0 && (
                        <div className="flex items-center justify-center gap-1 flex-wrap px-1">
                          {otherAvails.map(avail => {
                            const member = members.find(m => m.userId === avail.userId);
                            if (!member) return null;
                            return (
                              <div key={avail.userId} className="relative w-5 h-5 flex items-center justify-center" title={member.displayName}>
                                <div className={`absolute inset-0 rounded-full opacity-10 ${getDotColor(avail.status)}`} />
                                <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white ${getDotColor(avail.status)}`} />
                                <span className="text-[11px] relative z-10">{member.avatarEmoji}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showSaved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#534AB7] text-white px-5 py-2 rounded-full shadow-lg font-semibold text-[12px] z-50">
          Sauvegardé ✓
        </div>
      )}
    </main>
  );
}
