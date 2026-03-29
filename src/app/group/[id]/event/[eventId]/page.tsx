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

  if (!isLoaded || !localUser) return null;

  if (events === undefined || availData === undefined || members === undefined) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (!event) {
    return <div className="p-8 text-center">Sortie introuvable</div>;
  }

  const { dates, availabilities } = availData;

  const convergenceResults = useMemo(() => {
    if (!availData || !members) return [];
    return computeConvergence(availData.dates, availData.availabilities, members.length);
  }, [availData, members]);

  const optimalSlots = convergenceResults.filter((r: any) => r.status === "optimal");

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
        return "bg-[#f0faf6] text-[#1D9E75] border-transparent";
      case "flexible":
        return "bg-[#fef9f0] text-[#EF9F27] border-transparent";
      case "busy":
        return "bg-[#fef2f2] text-[#E24B4A] border-transparent";
      default:
        return "bg-white text-gray-400 border-dashed border-gray-200 hover:bg-gray-50";
    }
  };

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case "available": return "Disponible";
      case "flexible": return "Flexible";
      case "busy": return "Occupé";
      default: return "À remplir";
    }
  };

  const getDotColor = (status: string) => {
    switch (status) {
      case "available": return "bg-[#1D9E75]";
      case "flexible": return "bg-[#EF9F27]";
      case "busy": return "bg-[#E24B4A]";
      default: return "bg-gray-200";
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 pt-12 pb-24 relative">
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          ←
        </button>

        <div className="flex-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
            event.status === 'open' ? 'bg-gray-100 text-gray-700' :
            event.status === 'confirmed' ? 'bg-[#f0faf6] text-[#1D9E75]' :
            'bg-[#fef2f2] text-[#E24B4A]'
          }`}>
            {event.status === 'open' ? 'Ouvert' :
             event.status === 'confirmed' ? 'Confirmé' : 'Annulé'}
          </span>
        </div>
      </div>

      {optimalSlots.length > 0 && (
        <div style={{ background: "#EEEDFE", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ color: "#534AB7", fontWeight: 500, fontSize: 13 }}>
            ✦ Convergence trouvée
          </div>
          {optimalSlots.map((s: any) => (
            <div key={s.eventDateId + s.slot} style={{ color: "#534AB7", fontSize: 12, marginTop: 4 }}>
              {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · {SLOT_LABELS[s.slot]}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-8">
        {dates.map((dateObj) => {
          const dateStr = new Date(dateObj.date).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });

          // Trouver qui est dispo au moins une fois ce jour-là ? 
          // La consigne dit "emojis des membres colorés selon leur état majoritaire sur cette date"
          // Simplifions en affichant juste les emojis des membres présents sur ce jour pour le moment (optionnel, 
          // mais vu la description : "En-tête : date formatée... + emojis des membres").
          // Je vais juste afficher la date formatée pour le moment.

          return (
            <div key={dateObj._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-lg font-semibold capitalize mb-4 text-gray-900 border-b border-gray-100 pb-3">
                {dateStr}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {SLOTS.map((slot) => {
                  const slotAvails = availabilities.filter(
                    (a) => a.eventDateId === dateObj._id && a.slot === slot.id
                  );
                  const myAvail = slotAvails.find((a) => a.userId === localUser.userId);
                  const currentStatus = myAvail ? (myAvail.status as Status) : null;
                  
                  const otherAvails = slotAvails.filter(a => a.userId !== localUser.userId);

                  return (
                    <div key={slot.id} className="flex flex-col gap-1.5">
                      <button
                        onClick={() => handleSlotClick(dateObj._id, slot.id, currentStatus)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-colors ${getStatusStyles(currentStatus)}`}
                      >
                        <span className="text-sm font-medium text-gray-900 mb-1">{slot.label}</span>
                        <span className="text-xs font-semibold">{getStatusLabel(currentStatus)}</span>
                      </button>
                      
                      {/* Emojis des autres membres */}
                      {otherAvails.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 justify-center flex-wrap">
                          {otherAvails.map(avail => {
                            const member = members.find(m => m.userId === avail.userId);
                            if (!member) return null;
                            return (
                              <div key={avail.userId} className="relative flex items-center justify-center w-6 h-6" title={member.displayName}>
                                <div className={`absolute inset-0 rounded-full opacity-20 ${getDotColor(avail.status)}`}></div>
                                <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${getDotColor(avail.status)}`}></div>
                                <span className="text-sm relative z-10">{member.avatarEmoji}</span>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm animate-fade-in-out z-50">
          Sauvegardé ✓
        </div>
      )}
    </main>
  );
}
