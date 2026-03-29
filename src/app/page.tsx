"use client";

import { useEffect, useState, FormEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getLocalUser, saveLocalUser, createUserId, type LocalUser } from "@/lib/user";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
    <Link href={`/group/${group._id}`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-blue-200 transition-colors cursor-pointer group">
      <span className="font-medium text-lg">{group.name}</span>
      <button 
        onClick={copyLink} 
        className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      >
        {copied ? "Lien copié !" : "Copier le lien"}
      </button>
    </Link>
  );
}

export default function Home() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  // Onboarding state
  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Create group state
  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState("");
  const createGroup = useMutation(api.groups.createGroup);

  useEffect(() => {
    const localUser = getLocalUser();
    setUser(localUser);
    setIsLoaded(true);

    // If user exists and there is an invite token, redirect to invite page
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
      const result = await createGroup({
        name: groupName.trim(),
        userId: user.userId,
        displayName: user.displayName,
        avatarEmoji: user.avatarEmoji,
      });
      
      // Reset form
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

  if (!isLoaded) return <div className="p-8 text-center">Chargement...</div>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto p-6 pt-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Bienvenue sur Convergo</h1>
        <form onSubmit={handleOnboard} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-sm font-medium mb-2">Comment tu t'appelles ?</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ton prénom"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">Choisis un emoji</label>
            <div className="grid grid-cols-5 gap-2">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`text-2xl p-2 rounded-lg transition-colors ${
                    avatarEmoji === emoji ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-gray-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Commencer
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6 pt-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">
          Bonjour {user.displayName} {user.avatarEmoji}
        </h1>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Mes groupes</h2>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isCreating ? "Annuler" : "＋ Créer un groupe"}
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateGroup} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-3">
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Nom du groupe"
              className="flex-1 p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
            <button 
              type="submit"
              disabled={!groupName.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Créer
            </button>
          </form>
        )}

        {groups === undefined ? (
          <p className="text-gray-500">Chargement de vos groupes...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">Vous n'avez pas encore de groupe.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map(group => (
              <GroupCard key={group._id} group={group} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
