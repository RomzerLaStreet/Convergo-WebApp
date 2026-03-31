"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { getLocalUser } from "@/lib/user";
import { useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
  const [localUser, setUser] = useState<ReturnType<typeof getLocalUser>>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const u = getLocalUser();
    setUser(u);
    setIsLoaded(true);
    if (!u) router.push("/");
  }, [router]);

  const group = useQuery(api.groups.getGroupById, { groupId: id as Id<"groups"> });
  const members = useQuery(api.groups.getGroupMembers, { groupId: id as Id<"groups"> });
  const events = useQuery(api.events.getEvents, { groupId: id as Id<"groups"> });
  const createEvent = useMutation(api.events.createEvent);

  const [isCreating, setIsCreating] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  if (!isLoaded || !localUser) return null;

  if (group === undefined || members === undefined || events === undefined) {
    return null;
  }

  if (group === null) {
    return (
      <main className="max-w-[430px] mx-auto min-h-screen bg-[#F7F6F3] p-6 flex items-center justify-center">
        <p className="text-[#888580] text-[14px]">Groupe introuvable</p>
      </main>
    );
  }

  const displayMembers = members.slice(0, 4);
  const extraMembersCount = members.length - 4;

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || selectedDates.length === 0) return;
    
    await createEvent({
      groupId: id as Id<"groups">,
      title: eventTitle.trim(),
      userId: localUser.userId,
      dates: selectedDates,
    });
    
    setIsCreating(false);
    setEventTitle("");
    setSelectedDates([]);
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr);
      }
      if (prev.length >= 7) return prev;
      return [...prev, dateStr];
    });
  };

  const next14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoDate = d.toISOString().split("T")[0];
    const shortFormat = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    return { isoDate, shortFormat };
  });

  return (
    <main className="max-w-[430px] mx-auto min-h-screen bg-[#F7F6F3] p-6 pt-8">
      <header className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => router.back()}
          className="text-[20px] text-[#534AB7] font-medium"
        >
          ←
        </button>
        
        <h1 className="flex-1 text-[18px] font-bold text-[#1A1714] truncate">{group.name}</h1>

        <div className="flex items-center -space-x-[8px]">
          {displayMembers.map(member => (
            <div 
              key={member._id} 
              className="w-6 h-6 rounded-full bg-white border-2 border-[#E8E6E1] flex items-center justify-center text-[12px] z-10"
              title={member.displayName}
            >
              {member.avatarEmoji}
            </div>
          ))}
          {extraMembersCount > 0 && (
            <div className="w-6 h-6 rounded-full bg-[#F7F6F3] border-2 border-white flex items-center justify-center text-[9px] font-bold z-0 text-[#888580]">
              +{extraMembersCount}
            </div>
          )}
        </div>
      </header>

      {isCreating ? (
        <div className="bg-white border border-[#E8E6E1] rounded-[12px] p-[14px_16px] mb-8">
          <h3 className="text-[16px] font-bold text-[#1A1714] mb-4">Nouvelle sortie</h3>
          
          <div className="mb-4">
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full bg-white border border-[#E8E6E1] rounded-[8px] p-[12px_14px] outline-none focus:border-[#534AB7] transition-colors"
              placeholder="Ex: Soirée ciné"
            />
          </div>

          <div className="mb-6">
            <p className="text-[12px] font-semibold text-[#888580] mb-3 uppercase tracking-wider">Sélectionne les dates</p>
            <div className="grid grid-cols-3 gap-2">
              {next14Days.map((day) => {
                const isSelected = selectedDates.includes(day.isoDate);
                const isDisabled = !isSelected && selectedDates.length >= 7;
                return (
                  <button
                    key={day.isoDate}
                    onClick={() => toggleDate(day.isoDate)}
                    disabled={isDisabled}
                    className={`p-2 text-[11px] rounded-[8px] transition-all font-semibold border-[1.5px] ${
                      isSelected 
                        ? "bg-[#EEEDFE] border-[#534AB7] text-[#534AB7]" 
                        : "bg-[#F7F6F3] border-transparent text-[#1A1714]"
                    } ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
                  >
                    {day.shortFormat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setIsCreating(false)}
              className="flex-1 py-2 text-[13px] font-semibold text-[#888580]"
            >
              Annuler
            </button>
            <button 
              onClick={handleCreateEvent}
              disabled={!eventTitle.trim() || selectedDates.length === 0}
              className="flex-[2] bg-[#534AB7] text-white font-semibold py-3 rounded-[10px] text-[14px] disabled:opacity-50"
            >
              Créer →
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[11px] uppercase tracking-[0.5px] text-[#888580] font-semibold">Sorties</h2>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-[#534AB7] text-white font-semibold px-4 py-2 rounded-[10px] text-[12px]"
            >
              ＋ Nouvelle sortie
            </button>
          </div>

          {events.length === 0 ? (
            <div className="bg-white border border-[#E8E6E1] rounded-[12px] p-10 text-center">
              <p className="text-[#888580] text-[14px]">Aucune sortie pour l'instant</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <EventCard key={event._id} event={event} groupId={id} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function EventCard({ event, groupId }: { event: any, groupId: string }) {
  const dates = useQuery(api.events.getEventDates, { eventId: event._id });
  const updateEventStatus = useMutation(api.events.updateEventStatus);

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    updateEventStatus({ eventId: event._id, status: "confirmed" });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    updateEventStatus({ eventId: event._id, status: "cancelled" });
  };

  const statusStyles = {
    open: "bg-[#F3F2FF] text-[#534AB7]",
    confirmed: "bg-[#F0FAF6] text-[#1D9E75]",
    cancelled: "bg-[#FEF2F2] text-[#DC2626]"
  };

  const statusLabels = {
    open: "Ouvert",
    confirmed: "Confirmé",
    cancelled: "Annulé"
  };

  return (
    <Link 
      href={`/group/${groupId}/event/${event._id}`}
      className="block bg-white border border-[#E8E6E1] rounded-[12px] p-[14px_16px] hover:border-[#534AB7] transition-colors"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[14px] font-semibold text-[#1A1714]">{event.title}</span>
        <span className={`text-[11px] font-semibold px-[10px] py-[3px] rounded-full ${statusStyles[event.status as keyof typeof statusStyles]}`}>
          {statusLabels[event.status as keyof typeof statusLabels]}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#888580]">
          {dates ? `${dates.length} date${dates.length > 1 ? 's' : ''} proposée${dates.length > 1 ? 's' : ''}` : "Chargement..."}
        </span>

        {event.status === "open" && (
          <div className="flex gap-2">
            <button 
              onClick={handleConfirm}
              className="bg-[#F0FAF6] text-[#1D9E75] text-[11px] font-semibold px-3 py-1 rounded-full"
            >
              Confirmer
            </button>
            <button 
              onClick={handleCancel}
              className="bg-[#FEF2F2] text-[#DC2626] text-[11px] font-semibold px-3 py-1 rounded-full"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
