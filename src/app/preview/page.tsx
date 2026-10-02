import type { Metadata } from "next";
import { DraftPreview } from "./preview-client";
export const metadata: Metadata = { title: "Private draft preview", robots: { index: false, follow: false } };
export default function PreviewPage() { return <DraftPreview />; }
