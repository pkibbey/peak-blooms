import { UsersForm } from "@/components/admin/UsersForm"
import BackLink from "@/components/site/BackLink"

export const metadata = {
  title: "Add New User",
}

export default function NewUserPage() {
  return (
    <>
      <BackLink href="/admin/users" label="Users" />
      <div className="mb-8">
        <h1 className="heading-1">Add New User</h1>
        <p className="mt-2 text-muted-foreground">
          Create a new user account. New users will need approval before they can access the
          platform.
        </p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <UsersForm />
      </div>
    </>
  )
}
