export type PrivateGuestLink = { guestId: string; name: string; path: string };

/** Keep every newly generated link until the host has saved it elsewhere. */
export function mergePrivateGuestLinks(current: PrivateGuestLink[], incoming: PrivateGuestLink[]): PrivateGuestLink[] {
  const links = new Map(current.map(link => [link.guestId, link]));
  for (const link of incoming) links.set(link.guestId, link);
  return [...links.values()];
}
