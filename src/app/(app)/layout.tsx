// src/app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import ToastProvider from "@/components/ToastProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Next.js 16: createClient() is now synchronous (no await)
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header member={member} userEmail={session.user.email ?? ""} />
      <main className="pb-16">{children}</main>
      <ToastProvider />
    </div>
  );
}
