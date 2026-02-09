import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Auth is handled entirely client-side by AuthProvider (getSession +
  // onAuthStateChange). The previous server-side getUser() call added
  // 100-300ms+ of latency to every page navigation because it made a
  // network roundtrip to Supabase Auth before the page could render.
  // Removing it eliminates the single biggest source of page load delay.
  return NextResponse.next({ request });
}
