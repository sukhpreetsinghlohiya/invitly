import "server-only";
import { cache } from "react";

// One timestamp per server request, shared by every countdown in that render.
// Serialize the resulting remaining time to keep client hydration identical.
export const getRequestTimestamp = cache(() => Date.now());
