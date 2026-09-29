import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

async function allRows<Row>(query: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>) {
  const rows: Row[] = [];
  for (let from = 0; ; from += 500) {
    const result = await query(from, from + 499);
    if (result.error) throw new Error("Guest management is unavailable. Check your database setup and try again.");
    const page = result.data || [];
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}

/** Call after requireHostEvent; paginate so totals/CSV never stop at the API row cap. */
export async function getHostGuestData(client: SupabaseClient<Database>, eventId: string) {
  const [guests, groups, responses] = await Promise.all([
    allRows((from, to) => client.from("guests").select("id,name,email,phone,group_id,max_party_size").eq("event_id", eventId).order("created_at").order("id").range(from, to)),
    allRows((from, to) => client.from("guest_groups").select("id,name,function_ids").eq("event_id", eventId).order("name").order("id").range(from, to)),
    allRows((from, to) => client.from("guest_responses").select("guest_id,status,party_size,note,updated_at").eq("event_id", eventId).order("guest_id").range(from, to)),
  ]);
  return { guests, groups, responses };
}
