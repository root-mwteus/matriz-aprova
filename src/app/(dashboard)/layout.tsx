import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("suspenso")
    .eq("id", user.id)
    .single()

  if (profile?.suspenso) {
    await supabase.auth.signOut()
    redirect("/login?suspenso=1")
  }

  return <DashboardShell>{children}</DashboardShell>
}
