import { redirect } from "next/navigation"

// Legacy path - redirect to the standalone unauthorized page outside of the
// admin layout to avoid nav loops for unauthenticated users.
export default function LegacyUnauthorizedRedirect() {
  redirect("/admin-unauthorized")
}
