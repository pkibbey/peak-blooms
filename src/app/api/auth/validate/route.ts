import { getSession } from "@/lib/auth"

export async function GET(_request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new Response(JSON.stringify({ ok: false }), { status: 401 })
    }

    return new Response(JSON.stringify({ ok: true, user: { role: session.user.role } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  } catch (err) {
    console.error("/api/auth/validate error:", err)
    return new Response(JSON.stringify({ ok: false }), { status: 500 })
  }
}
