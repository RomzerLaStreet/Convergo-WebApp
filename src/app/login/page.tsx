"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      if (inviteToken) {
        router.push(`/invite/${inviteToken}`);
      } else {
        router.push("/");
      }
    }
  }, [user, authLoading, inviteToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;

    setIsLoading(true);

    const params = new URLSearchParams();
    params.set("login_hint", email);
    params.set("connection", "email");
    
    if (inviteToken) {
      params.set("returnTo", `/invite/${inviteToken}`);
    }

    window.location.href = `/auth/login?${params.toString()}`;
  };

  if (authLoading) return null;

  return (
    <main className="min-h-screen bg-[var(--surface)] flex flex-col items-center pt-[100px] px-4">
      <div className="w-full max-w-[430px] flex flex-col items-start p-[48px_16px]">
        <header className="mb-8">
          <span className="text-[18px] font-[700] text-[var(--accent)]">convergo</span>
        </header>

        <h1 className="text-[22px] font-[700] text-[var(--ink)] mb-2">Connexion</h1>
        <p className="text-[14px] text-[var(--muted)] mb-8">
          Entre ton email — on t'envoie un code à usage unique.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            required
            className="w-full bg-white border border-[var(--border)] rounded-[8px] p-[12px_14px] outline-none focus:border-[var(--accent)] transition-colors text-[15px]"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--accent)] text-white font-[600] py-[14px] rounded-[12px] hover:opacity-90 transition-opacity disabled:opacity-50 text-[15px]"
          >
            {isLoading ? "Envoi en cours..." : "Recevoir un code →"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
