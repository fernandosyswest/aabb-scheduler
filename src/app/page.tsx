// src/app/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  // Next.js 16: createClient() is synchronous
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
