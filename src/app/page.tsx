"use client";

import { useEffect, useState, FormEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getLocalUser, saveLocalUser, createUserId, type LocalUser } from "@/lib/user";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const EMOJIS = [
  "😊", "😎", "🤩", "🥳", "😄", "🙂", "😏", "🤓", "😇", "🥰",
  "😜", "🤗", "😴", "😤", "🤔", "🫠", "🥸", "😈", "👻", "🤖"
];

function GroupCard({ group }: { group: any }) {
  const [copied, setCopied] = useState(false);

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const link = `${window.location.origin}/invite/${group.inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link href={`/group/${group._id}`} className="block bg-white border border-[#E8E6E1] rounded-[12px] p-[14px_16px] hover:border-[#534AB7] transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[15px] font-semibold text-[#1A1714]">{group.name}</span>
        <span className="bg-[#F3F2FF] text-[#534AB7] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
          Ouvert
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex -space-x-[6px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-[#EEEDFE] border-2 border-white flex items-center justify-center text-[12px] z-[1]">
                👤
              </div>
            ))}
          </div>
          <span className="text-[12px] color-[#888580] ml-2">3 membres</span>
        </div>
        
        <button 
          onClick={copyLink}
          className="text-[#534AB7] text-[12px] font-semibold hover:underline"
        >
          {copied ? "Lien copié !" : "Inviter →"}
        </button>
      </div>

      <div className="mt-3 h-1 w-full bg-[#F0F0F0] rounded-full overflow-hidden">
        <div className="h-full bg-[#534AB7] w-1/3 rounded-full" />
      </div>
    </Link>
  );
}

function HomeContent() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState("");
  const createGroup = useMutation(api.groups.createGroup);

  useEffect(() => {
    const localUser = getLocalUser();
    setUser(localUser);
    setIsLoaded(true);

    if (localUser && inviteToken) {
      router.push(`/invite/${inviteToken}`);
    }
  }, [inviteToken, router]);

  const handleOnboard = (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Ton prénom ne peut pas être vide");
      return;
    }
    if (!avatarEmoji) {
      setError("Choisis un emoji");
      return;
    }
    
    const newUser: LocalUser = {
      userId: createUserId(),
      displayName: displayName.trim(),
      avatarEmoji
    };
    
    saveLocalUser(newUser);
    setUser(newUser);
    
    if (inviteToken) {
      router.push(`/invite/${inviteToken}`);
    }
  };

  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !groupName.trim()) return;
    
    try {
      await createGroup({
        name: groupName.trim(),
        userId: user.userId,
        displayName: user.displayName,
        avatarEmoji: user.avatarEmoji,
      });
      setGroupName("");
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    }
  };

  const groups = useQuery(
    api.groups.getMyGroups,
    user ? { userId: user.userId } : "skip"
  );

  if (!isLoaded) return null;

  if (!user) {
    return (
      <main className="max-w-[430px] mx-auto min-h-screen bg-[#F7F6F3]">
        <header className="p-[20px_16px]">
          <span className="text-[18px] font-bold text-[#534AB7]">convergo</span>
        </header>

        <div className="p-6 pt-4">
          <h1 className="text-[22px] font-bold text-[#1A1714] mb-1">Bienvenue !</h1>
          <p className="text-[14px] text-[#888580] mb-8">Comment tu t'appelles ?</p>

          <form onSubmit={handleOnboard} className="space-y-8">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Ton prénom"
              className="w-full bg-white border border-[#E8E6E1] rounded-[8px] p-[12px_14px] outline-none focus:border-[#534AB7] transition-colors"
            />
            
            <div>
              <p className="text-[14px] font-semibold mb-3">Choisis un emoji</p>
              <div className="grid grid-cols-5 gap-2">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarEmoji(emoji)}
                    className={`w-full aspect-square flex items-center justify-center text-[20px] rounded-[8px] bg-[#F7F6F3] border-[1.5px] transition-all ${
                      avatarEmoji === emoji ? "bg-[#EEEDFE] border-[#534AB7]" : "border-transparent"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-[#DC2626] text-[12px] font-medium">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-[#534AB7] text-white font-semibold py-[12px] rounded-[10px] hover:opacity-90 transition-opacity"
            >
              Commencer
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[430px] mx-auto min-h-screen bg-[#F7F6F3] p-6 pt-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-[20px] font-bold text-[#1A1714]">Mes groupes</h1>
        <div className="flex items-center bg-[#534AB7] text-white rounded-full p-[6px_12px] gap-2">
          <span className="text-[14px]">{user.avatarEmoji}</span>
          <span className="text-[13px] font-semibold">{user.displayName}</span>
        </div>
      </header>

      {/* Bandeau Convergence fictif pour le design */}
      <div className="bg-[#534AB7] rounded-[12px] p-[14px_16px] mb-8">
        <span className="block text-[11px] font-semibold text-[#AFA9EC] uppercase tracking-wider mb-1">
          ✦ Prochaine convergence
        </span>
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-white">Vendredi 12 Mars · Soirée</span>
          <span className="bg-white text-[#534AB7] rounded-full p-[4px_12px] text-[12px] font-semibold">
            Voir →
          </span>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-[11px] uppercase tracking-[0.5px] text-[#888580] font-semibold mb-4">
          En cours
        </h2>

        {isCreating && (
          <form onSubmit={handleCreateGroup} className="bg-white border border-[#E8E6E1] rounded-[12px] p-[14px_16px] mb-4 space-y-3">
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Nom du groupe"
              className="w-full bg-white border border-[#E8E6E1] rounded-[8px] p-[10px_12px] outline-none focus:border-[#534AB7]"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 text-[13px] font-semibold text-[#888580]"
              >
                Annuler
              </button>
              <button 
                type="submit"
                disabled={!groupName.trim()}
                className="flex-1 bg-[#534AB7] text-white text-[13px] font-semibold py-2 rounded-[8px] disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </form>
        )}

        {groups === undefined ? (
          <div className="flex flex-col gap-4">
             {[1, 2].map(i => (
               <div key={i} className="h-[120px] bg-white border border-[#E8E6E1] rounded-[12px] animate-pulse" />
             ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#E8E6E1] rounded-[12px]">
            <p className="text-[#888580] text-[14px]">Aucun groupe pour l'instant</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map(group => (
              <GroupCard key={group._id} group={group} />
            ))}
          </div>
        )}

        <button 
          onClick={() => setIsCreating(true)}
          className="w-full mt-4 bg-[#534AB7] text-white font-semibold py-[12px] rounded-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          ＋ Créer un groupe
        </button>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
