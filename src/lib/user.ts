export type LocalUser = {
  userId: string;
  displayName: string;
  avatarEmoji: string;
};

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("convergo_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export function saveLocalUser(user: LocalUser): void {
  localStorage.setItem("convergo_user", JSON.stringify(user));
}

export function createUserId(): string {
  return crypto.randomUUID();
}
