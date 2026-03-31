"use client";

import { use, useState, useEffect } from "react";
import { api } from "../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { getLocalUser, saveLocalUser, createUserId, type LocalUser } from "@/lib/user";

const EMOJIS = [
  "😊", "😎", "🤩", "🥳", "😄", "🙂", "😏", "🤓", "😇", "🥰",
  "😜", "🤗", "😴", "😤", "🤔", "🫠", "🥸", "😈", "👻", "🤖"
];

export default function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    setLocalUser(getLocalUser());
  }, []);

  const group = useQuery(api.groups.getGroupByInviteToken, {
    inviteToken: token,
  });
  const joinGroup = useMutation(api.groups.joinGroup);

  if (group === undefined) {
    return null;
  }

  if (group === null) {
    return (
      <main className="max-w-[430px] mx-auto min-h-screen bg-[#F7F6F3] p-6 flex items-center justify-center">
        <div className="bg-white border border-[#E8E6E1] rounded-[12px] p-8 text-center w-full">
          <p className="text-[#1A1714] font-bold mb-2">Lien invalide</p>
          <p className="text-[#888580] text-[14px]">Ce lien d'invitation n'existe plus ou a expiré.</p>
        </div>
      </main>
    );
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    
    let userToUse = localUser;

    if (!userToUse) {
      if (!displayName.trim()) {
        setError("Ton prénom ne peut pas être vide");
        return;
      }
      if (!avatarEmoji) {
        setError("Choisis un emoji");
        return;
      }
      
      userToUse = {
        userId: createUserId(),
        displayName: displayName.trim(),
        avatarEmoji
      };
      saveLocalUser(userToUse);
      setLocalUser(userToUse);
    }

    try {
      await joinGroup({
        groupId: group!._id,
        userId: userToUse.userId,
        displayName: userToUse.displayName,
        avatarEmoji: userToUse.avatarEmoji,
      });

      router.push(`/group/${group!._id}`);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <main className="max-w-[430px] mx-auto min-h-screen bg-[#F7F6F3] p-6 pt-12">
      <div className="text-center mb-10">
        <h1 className="text-[22px] font-bold text-[#1A1714] mb-2">{group.name}</h1>
        <p className="text-[14px] text-[#888580]">
          Tu as été invité·e à rejoindre ce groupe
        </p>
      </div>

      {!localUser ? (
        <form onSubmit={handleJoin} className="space-y-8">
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

          {error && <p className="text-[#DC2626] text-[12px] font-medium text-center">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-[#534AB7] text-white font-semibold py-[12px] rounded-[10px] hover:opacity-90 transition-opacity"
          >
            Rejoindre le groupe →
          </button>
        </form>
      ) : (
        <div className="bg-white border border-[#E8E6E1] rounded-[12px] p-6 text-center">
          <div className="w-16 h-16 bg-[#EEEDFE] rounded-full flex items-center justify-center text-[32px] mx-auto mb-4">
            {localUser.avatarEmoji}
          </div>
          <p className="text-[15px] font-semibold text-[#1A1714] mb-6">
            Salut {localUser.displayName} !
          </p>
          <button
            onClick={handleJoin}
            className="w-full bg-[#534AB7] text-white font-semibold py-[12px] rounded-[10px] hover:opacity-90 transition-opacity"
          >
            Rejoindre le groupe →
          </button>
        </div>
      )}
    </main>
  );
}
