// src/app/(app)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Next.js 16: createClient() is synchronous
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: courts }, { data: member }, { data: allTournaments }] =
    await Promise.all([
      supabase.from("courts").select("*").order("name"),
      supabase
        .from("members")
        .select("*")
        .eq("user_id", session!.user.id)
        .single(),
      supabase
        .from("tournaments")
        .select("*, tournament_registrations(count)")
        .in("status", ["registration", "in_progress"])
        .order("start_date"),
    ]);

  const today = new Date().toISOString().split("T")[0];

  const { data: myBookings } = member
    ? await supabase
        .from("bookings")
        .select("*, court:courts(*)")
        .eq("member_id", member.id)
        .eq("status", "confirmed")
        .gte("booking_date", today)
        .order("booking_date")
        .order("start_time")
        .limit(5)
    : { data: [] };

  const { data: todayBookings } = await supabase
    .from("bookings")
    .select("court_id, start_time, end_time, member_id")
    .eq("booking_date", today)
    .eq("status", "confirmed");

  const { count: membersCount } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  return (
    <DashboardClient
      courts={courts ?? []}
      member={member}
      myBookings={myBookings ?? []}
      todayBookings={todayBookings ?? []}
      tournaments={allTournaments ?? []}
      membersCount={membersCount ?? 0}
    />
  );
}
