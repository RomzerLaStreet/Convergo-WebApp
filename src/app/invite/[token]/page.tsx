"use client";

import { use } from "react";
import { api } from "../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { getLocalUser } from "@/lib/user";

export default function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const group = useQuery(api.groups.getGroupByInviteToken, {
    inviteToken: token,
  });
  const joinGroup = useMutation(api.groups.joinGroup);

  if (group === null) {
    return (
      <div className="max-w-[430px] mx-auto px-4 py-10 bg-white min-h-screen">
        <div className="text-gray-900 font-medium">Lien invalide</div>
      </div>
    );
  }

  if (group === undefined) {
    return (
      <div className="max-w-[430px] mx-auto px-4 py-10 bg-white min-h-screen">
        <div className="text-gray-900 font-medium">Chargement...</div>
      </div>
    );
  }

  async function handleJoin() {
    const localUser = getLocalUser();
    
    if (!localUser) {
      router.push(`/?invite=${token}`);
      return;
    }

    try {
      await joinGroup({
        groupId: group!._id,
        userId: localUser.userId,
        displayName: localUser.displayName,
        avatarEmoji: localUser.avatarEmoji,
      });

      router.push(`/group/${group!._id}`);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="max-w-[430px] mx-auto px-4 py-10 bg-white min-h-screen text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h1>
      <p className="text-gray-600 mb-8">
        Tu as été invité·e à rejoindre le groupe <strong>{group.name}</strong>.
      </p>

      <button
        onClick={handleJoin}
        className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors"
      >
        Rejoindre le groupe
      </button>
    </div>
  );
}
