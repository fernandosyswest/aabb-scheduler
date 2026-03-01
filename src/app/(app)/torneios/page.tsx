// src/app/(app)/torneios/page.tsx
import { createClient } from "@/lib/supabase/server";
import TorneiosClient from "@/components/TorneiosClient";

export const dynamic = "force-dynamic";

export default async function TorneiosPage() {
  // Next.js 16: createClient() is synchronous
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: member }, { data: tournaments }] = await Promise.all([
    supabase
      .from("members")
      .select("*")
      .eq("user_id", session!.user.id)
      .single(),
    supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const { data: allRegistrations } = await supabase
    .from("tournament_registrations")
    .select("*, member:members(full_name, member_number)")
    .in("status", ["registered", "confirmed"]);

  const activeTournamentIds = (tournaments ?? [])
    .filter((t) => t.status === "in_progress")
    .map((t) => t.id);

  const { data: matches } = activeTournamentIds.length
    ? await supabase
        .from("tournament_matches")
        .select("*")
        .in("tournament_id", activeTournamentIds)
        .order("round")
        .order("match_number")
    : { data: [] };

  return (
    <TorneiosClient
      member={member}
      tournaments={tournaments ?? []}
      allRegistrations={allRegistrations ?? []}
      matches={matches ?? []}
    />
  );
}
