import { redirect } from "next/navigation"

export default function HistoryPage() {
  // Server-side redirect to the dashboard history tab
  redirect("/dashboard?tab=history")
}
