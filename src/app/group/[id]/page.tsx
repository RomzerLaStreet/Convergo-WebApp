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

  if (!isLoaded || !localUser) return null; // will redirect

  if (group === undefined || members === undefined || events === undefined) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (group === null) {
    return <div className="p-8 text-center">Groupe introuvable</div>;
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

  // Generate next 14 days
  const next14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoDate = d.toISOString().split("T")[0]; // YYYY-MM-DD
    const shortFormat = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    return { isoDate, shortFormat };
  });

  return (
    <main className="max-w-2xl mx-auto p-6 pt-12">
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          ←
        </button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{group.name}</h1>
        </div>

        <div className="flex items-center -space-x-2">
          {displayMembers.map(member => (
            <div 
              key={member._id} 
              className="w-10 h-10 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-lg z-10"
              title={member.displayName}
            >
              {member.avatarEmoji}
            </div>
          ))}
          {extraMembersCount > 0 && (
            <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-sm font-medium z-0">
              +{extraMembersCount}
            </div>
          )}
        </div>
      </div>

      {!isCreating ? (
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Sorties</h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            ＋ Nouvelle sortie
          </button>
        </div>
      ) : null}

      {isCreating ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Créer une nouvelle sortie</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nom de la sortie</label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#534AB7] focus:border-transparent outline-none"
              placeholder="Ex: Soirée ciné"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Sélectionne les dates possibles (max 7)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {next14Days.map((day) => {
                const isSelected = selectedDates.includes(day.isoDate);
                const isDisabled = !isSelected && selectedDates.length >= 7;
                return (
                  <button
                    key={day.isoDate}
                    onClick={() => toggleDate(day.isoDate)}
                    disabled={isDisabled}
                    className={`py-2 px-1 text-sm rounded-lg transition-colors font-medium border-2 ${
                      isSelected 
                        ? "bg-[#EEEDFE] border-[#534AB7] text-[#534AB7]" 
                        : isDisabled
                          ? "bg-gray-50 border-transparent text-gray-400 opacity-50 cursor-not-allowed"
                          : "bg-gray-100 border-transparent hover:bg-gray-200 text-gray-700"
                    }`}
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
              className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button 
              onClick={handleCreateEvent}
              disabled={!eventTitle.trim() || selectedDates.length === 0}
              className="bg-[#534AB7] text-white font-medium px-6 py-2 rounded-lg hover:bg-[#433A97] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Créer la sortie →
            </button>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-500 mb-6">Aucune sortie pour l'instant</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <EventCard key={event._id} event={event} groupId={id} />
          ))}
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

  return (
    <Link 
      href={`/group/${groupId}/event/${event._id}`}
      className={`block bg-white border border-gray-100 shadow-sm p-4 rounded-xl hover:border-[#534AB7] transition-colors ${
        event.status === "confirmed" ? "border-l-[3px] border-l-[#1D9E75]" : ""
      } ${
        event.status === "cancelled" ? "opacity-50" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-lg text-gray-900">{event.title}</span>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            event.status === 'open' ? 'bg-blue-100 text-blue-700' :
            event.status === 'confirmed' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            {event.status === 'open' ? 'Ouvert' :
             event.status === 'confirmed' ? 'Confirmé' : 'Annulé'}
          </span>
          {event.status === "open" && (
            <div className="flex gap-2 mt-1">
              <button 
                onClick={handleConfirm}
                className="text-xs bg-[#f0faf6] text-[#1D9E75] hover:bg-[#d1f4e5] px-2 py-1 rounded transition-colors"
              >
                Confirmer
              </button>
              <button 
                onClick={handleCancel}
                className="text-xs bg-[#fef2f2] text-[#E24B4A] hover:bg-[#fee2e2] px-2 py-1 rounded transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500">
        {dates ? `${dates.length} date${dates.length > 1 ? 's' : ''} proposée${dates.length > 1 ? 's' : ''}` : "Chargement..."}
      </p>
    </Link>
  );
}
