import { PageSkeleton } from "@/components/page-skeleton";
// Keep streaming loading UI inside the interactive editor. Public invitations
// must arrive as usable HTML even when the browser cannot run JavaScript.
export default function Loading() { return <PageSkeleton label="Getting your editor ready…" />; }
