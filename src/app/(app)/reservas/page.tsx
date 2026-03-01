// src/app/(app)/reservas/page.tsx
import { createClient } from "@/lib/supabase/server";
import ReservasClient from "@/components/ReservasClient";

export const dynamic = "force-dynamic";

export default async function ReservasPage() {
  // Next.js 16: createClient() is synchronous
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const today = new Date().toISOString().split("T")[0];

  const [{ data: courts }, { data: member }] = await Promise.all([
    supabase.from("courts").select("*").order("name"),
    supabase
      .from("members")
      .select("*")
      .eq("user_id", session!.user.id)
      .single(),
  ]);

  const { data: myBookings } = member
    ? await supabase
        .from("bookings")
        .select("*, court:courts(*)")
        .eq("member_id", member.id)
        .eq("status", "confirmed")
        .gte("booking_date", today)
        .order("booking_date")
        .order("start_time")
    : { data: [] };

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 6);

  const { data: allBookings } = await supabase
    .from("bookings")
    .select("*, member:members(full_name)")
    .eq("status", "confirmed")
    .gte("booking_date", today)
    .lte("booking_date", endDate.toISOString().split("T")[0])
    .order("booking_date")
    .order("start_time");

  return (
    <ReservasClient
      courts={courts ?? []}
      member={member}
      myBookings={myBookings ?? []}
      allBookings={allBookings ?? []}
    />
  );
}
