import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Public demo/marketing routes do not need an auth round trip.
export const config = { matcher: ["/account/:path*", "/dashboard/:path*", "/customize", "/login", "/signup", "/forgot-password", "/reset-password", "/resend-confirmation", "/auth/:path*"] };
