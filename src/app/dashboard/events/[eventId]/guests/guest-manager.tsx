"use client";

import { formatPhoneInput } from "@/lib/phone-input";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { deleteGuest, importGuests, rotateGuestLink, saveGuest, saveGuestGroup, setPublicFunctionVisibility } from "@/app/dashboard/guest-actions";
import { guestCsv } from "@/lib/guest-validation";
import { BusyIndicator, toast, useConfirmDialog } from "@/components/ui/feedback";
import feedbackStyles from "@/components/ui/feedback.module.css";

type Guest = { id: string; name: string; email: string; phone: string; group_id: string | null; max_party_size: number };
type Group = { id: string; name: string; function_ids: string[] | null };
type Response = { guest_id: string; status: "attending" | "maybe" | "declined"; party_size: number; note: string; updated_at: string };
type Result = { error?: string; success?: string; links?: { name: string; path: string }[] };
const blankGuest = { name: "", email: "", phone: "", groupId: "", maxPartySize: 1 };

function downloadCsv(name: string, contents: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", contents], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); toast({ title: "CSV download started." });
}

export function GuestManager({ eventId, guests, groups, responses, functions, publicFunctionIds }: { eventId: string; guests: Guest[]; groups: Group[]; responses: Response[]; functions: { id: string; name: string }[]; publicFunctionIds: string[] | null }) {
  const router = useRouter();
  const running = useRef(false);
  const copying = useRef(false);
  const [copyPending, setCopyPending] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const { confirm, confirmationDialog } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search.trim().toLocaleLowerCase()), 180); return () => window.clearTimeout(timer); }, [search]);
  const [pending, setPending] = useState(false); const [result, setResult] = useState<Result>({});
  const [freshLinks, setFreshLinks] = useState<{ name: string; path: string }[]>([]);
  const [guest, setGuest] = useState(blankGuest); const [editing, setEditing] = useState<string>();
  const [groupName, setGroupName] = useState(""); const [groupId, setGroupId] = useState<string>();
  const [allFunctions, setAllFunctions] = useState(true); const [functionIds, setFunctionIds] = useState<string[]>([]);
  const [publicMode, setPublicMode] = useState(publicFunctionIds === null ? "all" : publicFunctionIds.length ? "selected" : "none");
  const [publicIds, setPublicIds] = useState<string[]>(publicFunctionIds || []);
  const responseMap = new Map(responses.map(item => [item.guest_id, item]));
  const count = (status: Response["status"]) => responses.filter(item => item.status === status).length;
  const filteredGuests = guests.filter(item => {
    if (!debouncedSearch) return true;
    const group = groups.find(value => value.id === item.group_id)?.name || "";
    const words = `${item.name} ${item.email} ${item.phone} ${group}`.toLocaleLowerCase();
    const digits = debouncedSearch.replace(/[\s().-]/g, "");
    return words.includes(debouncedSearch) || (/^\+?\d+$/.test(digits) && item.phone.replace(/[\s().-]/g, "").includes(digits));
  });
  async function run(work: () => Promise<Result>, after?: () => void) {
    if (running.current) return;
    running.current = true; setPending(true); setResult({});
    try { const next = await work(); setResult(next); if (next.links) setFreshLinks(next.links); if (!next.error) { if (next.success) toast({ title: next.links ? "Private links are ready." : "Changes saved." }); after?.(); router.refresh(); } }
    catch { setResult({ error: "The guest service is unavailable. Please try again." }); }
    finally { running.current = false; setPending(false); }
  }
  async function copyPrivateLink(link: { name: string; path: string }, input: HTMLInputElement | null) {
    if (copying.current) return;
    copying.current = true; setCopyPending(link.path);
    try { await navigator.clipboard.writeText(`${window.location.origin}${link.path}`); toast({ title: "Private link copied.", description: `Ready to share with ${link.name}.` }); }
    catch { setResult({ error: "Copy is unavailable in this browser. Select and copy the private link from its field." }); input?.focus(); input?.select(); }
    finally { copying.current = false; setCopyPending(""); }
  }
  async function addGuest(event: FormEvent) { event.preventDefault(); await run(() => saveGuest(eventId, { ...guest, id: editing, groupId: guest.groupId || null }), () => { setGuest(blankGuest); setEditing(undefined); }); }
  return <div className="guest-manager" aria-busy={pending}>{confirmationDialog}
    <div className="guest-totals" aria-label="RSVP totals"><div><strong>{guests.length}</strong><span>Invitations</span></div><div><strong>{count("attending")}</strong><span>Attending</span></div><div><strong>{count("maybe")}</strong><span>Maybe</span></div><div><strong>{count("declined")}</strong><span>Declined</span></div><div><strong>{guests.length - responses.length}</strong><span>Awaiting reply</span></div><div><strong>{responses.filter(item => item.status === "attending").reduce((sum, item) => sum + item.party_size, 0)}</strong><span>Attending people</span></div></div>
    <div aria-live="polite">{result.error && <p className="form-error" role="alert">{result.error}</p>}{result.success && <p className="form-success">{result.success}</p>}</div>
    {freshLinks.length > 0 && <section className="guest-links"><h2>Your new private links</h2><p>Copy or download these now. For privacy, the database stores hashes; links cannot be recovered later. You can replace a link at any time.</p><button className="button button-secondary" onClick={() => downloadCsv("invitly-private-guest-links.csv", guestCsv(["name", "private_link"], freshLinks.map(link => [link.name, `${window.location.origin}${link.path}`])))}>Download new private links</button>{freshLinks.length <= 5 && freshLinks.map(link => <div key={link.path} className="form-field"><label>{link.name}<input readOnly value={typeof window === "undefined" ? link.path : `${window.location.origin}${link.path}`} onFocus={event => event.currentTarget.select()} /></label><button type="button" className="button button-secondary button-small" disabled={Boolean(copyPending)} aria-busy={copyPending === link.path} aria-label={`Copy private link for ${link.name}`} onClick={event => void copyPrivateLink(link, event.currentTarget.closest(".form-field")?.querySelector("input") || null)}>{copyPending === link.path ? <BusyIndicator /> : null}{copyPending === link.path ? "Copying…" : "Copy private link"}</button></div>)}<button className="text-link" onClick={() => setFreshLinks([])}>Dismiss private links</button></section>}
    <section aria-labelledby="public-visibility-heading"><h2 id="public-visibility-heading">Public invitation visibility</h2>
      <p>The public link and private guest groups have separate schedules. A function visible on the public link can be viewed by anyone who knows that link.</p>
      {publicFunctionIds === null ? <p className="form-error">Your public link currently shows every function. To keep some functions private to a group, select only the public functions below.</p> : <p>Your public link currently shows {publicFunctionIds.length} functions. Private group links can include additional functions.</p>}
      <form onSubmit={event => { event.preventDefault(); void run(() => setPublicFunctionVisibility(eventId, publicMode === "all" ? null : publicMode === "none" ? [] : publicIds)); }}>
        <label className="form-field">Functions on the public link<select disabled={pending} value={publicMode} onChange={event => setPublicMode(event.target.value)}><option value="all">All functions</option><option value="selected">Selected functions</option><option value="none">No function schedule</option></select></label>
        {publicMode === "selected" && <fieldset><legend>Public functions</legend>{functions.map(item => <label className="guest-check" key={item.id}><input disabled={pending} type="checkbox" checked={publicIds.includes(item.id)} onChange={event => setPublicIds(event.target.checked ? [...publicIds, item.id] : publicIds.filter(id => id !== item.id))} />{item.name}</label>)}</fieldset>}
        <button className="button" disabled={pending} aria-busy={pending}>{pending && <BusyIndicator />}Save public visibility</button>
      </form>
    </section>
    <div className="guest-forms">
      <section><h2>{editing ? "Edit guest" : "Add a guest"}</h2><form onSubmit={addGuest}>
        <label className="form-field">Guest name<input disabled={pending} autoComplete="name" required maxLength={120} value={guest.name} onChange={e => setGuest({ ...guest, name: e.target.value })} /></label>
        <label className="form-field">Email (optional)<input disabled={pending} autoComplete="email" type="email" maxLength={254} value={guest.email} onChange={e => setGuest({ ...guest, email: e.target.value })} /></label>
        <label className="form-field">Phone (optional)<input disabled={pending} autoComplete="tel" inputMode="tel" placeholder="Include the country code, e.g. +91" type="tel" maxLength={40} value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.selectionStart === e.target.value.length ? formatPhoneInput(e.target.value) : e.target.value })} /><small>Use your country code. Spaces, brackets and a leading + are welcome.</small></label>
        <label className="form-field">Guest group<select disabled={pending} value={guest.groupId} onChange={e => setGuest({ ...guest, groupId: e.target.value })}><option value="">Public function selection</option>{groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
        <label className="form-field">Maximum party size<input disabled={pending} type="number" min={1} max={20} required value={guest.maxPartySize} onChange={e => setGuest({ ...guest, maxPartySize: Number(e.target.value) })} /></label>
        <button className="button" disabled={pending} aria-busy={pending}>{pending && <BusyIndicator />}{pending ? "Saving…" : editing ? "Save guest" : "Add guest & create link"}</button>{editing && <button type="button" disabled={pending} className="button button-secondary" onClick={() => { setEditing(undefined); setGuest(blankGuest); }}>Cancel edit</button>}
      </form></section>
      <section><h2>{groupId ? "Edit guest group" : "Create a guest group"}</h2><p>Choose which functions appear on this group’s private invitation.</p><form onSubmit={e => { e.preventDefault(); void run(() => saveGuestGroup(eventId, { id: groupId, name: groupName, functionIds: allFunctions ? null : functionIds }), () => { setGroupName(""); setGroupId(undefined); }); }}>
        <label className="form-field">Group name<input disabled={pending} required maxLength={80} value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Family, friends, reception guests…" /></label>
        <label className="guest-check"><input disabled={pending} type="checkbox" checked={allFunctions} onChange={e => setAllFunctions(e.target.checked)} /> All functions, including future additions</label>
        {!allFunctions && <fieldset><legend>Visible functions</legend>{functions.map(item => <label className="guest-check" key={item.id}><input disabled={pending} type="checkbox" checked={functionIds.includes(item.id)} onChange={e => setFunctionIds(e.target.checked ? [...functionIds, item.id] : functionIds.filter(id => id !== item.id))} />{item.name}</label>)}<p>Select none to show the invitation without a function schedule.</p></fieldset>}
        <button className="button" disabled={pending} aria-busy={pending}>{pending && <BusyIndicator />}{groupId ? "Save group" : "Create group"}</button>
      </form>{groups.length > 0 && <ul>{groups.map(group => <li key={group.id}>{group.name} · {group.function_ids === null ? "All functions" : `${group.function_ids.length} functions`} <button className="text-link" disabled={pending} onClick={() => { setGroupId(group.id); setGroupName(group.name); setAllFunctions(group.function_ids === null); setFunctionIds(group.function_ids || []); }}>Edit <span className="sr-only">{group.name}</span></button></li>)}</ul>}</section>
    </div>
    <section><h2>Import or export guests</h2><p>CSV imports support up to 500 guests. Create named groups first. The entire file is validated before any guests are added.</p><div className="guest-tools"><button className="button button-secondary" onClick={() => downloadCsv("invitly-guests-template.csv", "name,email,phone,group,max_party_size\r\nAman Singh,aman@example.com,+919876543210,,2")}>Download CSV template</button><a className="button button-secondary" href={`/dashboard/events/${eventId}/guests/export`}>Export guests & RSVPs</a></div><label className="form-field">Import guest CSV<input type="file" accept=".csv,text/csv" disabled={pending} onChange={async event => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (file.size > 512000) { setResult({ error: "Choose a CSV file smaller than 500 KB." }); return; } await run(async () => importGuests(eventId, await file.text())); }} /></label></section>
    <section><h2>Guest list</h2>{guests.length > 0 && <><div className={feedbackStyles.search}><label className="form-field" htmlFor="guest-search">Search guests</label><input ref={searchInput} id="guest-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, email, phone or group" autoComplete="off" />{search && <button type="button" className="button button-secondary button-small" onClick={() => { setSearch(""); setDebouncedSearch(""); searchInput.current?.focus(); }}>Clear</button>}</div><p className={feedbackStyles.searchMeta} role="status">{filteredGuests.length} of {guests.length} {guests.length === 1 ? "guest" : "guests"}</p></>}{!guests.length ? <div className={feedbackStyles.empty}><h3>Your guest list starts here.</h3><p>Add your first guest above, or import your list from a CSV file.</p></div> : !filteredGuests.length ? <div className={feedbackStyles.empty}><h3>No matching guests.</h3><p>Try another name, email address, phone number or group.</p><button type="button" className="button button-secondary" onClick={() => { setSearch(""); setDebouncedSearch(""); searchInput.current?.focus(); }}>Show all guests</button></div> : <div className="guest-table-wrap"><table className="guest-table"><thead><tr><th>Guest</th><th>Group</th><th>Response</th><th>Party</th><th>Note</th><th>Manage</th></tr></thead><tbody>{filteredGuests.map(item => { const response = responseMap.get(item.id); return <tr key={item.id}><td><strong>{item.name}</strong><small>{item.email || item.phone}</small></td><td>{groups.find(group => group.id === item.group_id)?.name || "Public selection"}</td><td>{response?.status || "Awaiting reply"}</td><td>{response ? response.party_size : "—"} / {item.max_party_size}</td><td>{response?.note || "—"}</td><td><button className="text-link" disabled={pending} onClick={() => { setEditing(item.id); setGuest({ name: item.name, email: item.email, phone: item.phone, groupId: item.group_id || "", maxPartySize: item.max_party_size }); }}>Edit <span className="sr-only">{item.name}</span></button><button className="text-link" disabled={pending} onClick={async () => { if (await confirm({ title: `Replace ${item.name}’s link?`, description: "The old private invitation link will stop working. Share the new link with this guest after replacing it.", confirmLabel: "Replace link" })) void run(() => rotateGuestLink(eventId, item.id)); }}>Replace link</button><button className="text-link" disabled={pending} onClick={async () => { if (await confirm({ title: `Remove ${item.name}?`, description: "Their RSVP will also be removed and their private link will stop working. This cannot be undone.", confirmLabel: "Remove guest" })) void run(() => deleteGuest(eventId, item.id)); }}>Remove</button></td></tr>; })}</tbody></table></div>}</section>
  </div>;
}
