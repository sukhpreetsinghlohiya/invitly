import { LegalPage } from "@/components/legal/legal-page";
import { legalDetails } from "@/lib/legal";
import { publicMetadata } from "@/lib/seo";
export const metadata = { ...publicMetadata("Terms of use", "Guidelines for creating invitations and responding to events on Invitly.", "/terms"), robots: { index: legalDetails.complete, follow: true } };
export default function TermsPage() {
  return <LegalPage title="Terms of use">
    <section><h2>Using Invitly</h2><p>Invitly helps hosts create and share digital invitations and manage guest responses. Use the service lawfully and provide accurate information. You are responsible for keeping your account credentials and private guest links secure.</p></section>
    <section><h2>Your content and your guests</h2><p>You retain ownership of content you upload. You allow Invitly and its service providers to store, process and display that content as needed to provide the features you use. Upload photographs, music, artwork and personal details only when you have the necessary rights and permissions.</p><p>Hosts are responsible for their event details, guest communications and use of exported guest information. Guests should respond only using links intended for them. Do not impersonate another guest or distribute private links without the host’s permission.</p></section>
    <section><h2>Acceptable use</h2><p>Do not upload unlawful, abusive or infringing content, send unwanted invitations, attempt to bypass access controls or disrupt the service. Features may be restricted when necessary to address misuse or protect other users.</p></section>
    <section><h2>External services and event details</h2><p>Maps, calendars, video players and messaging services are supplied by other providers. Check dates, time zones, venue addresses and directions before sharing. Invitly does not organize or guarantee the events described in invitations.</p></section>
    <section><h2>Availability and changes</h2><p>Features and designs may change as the service develops. Keep your own copy of important event details and guest records. Availability can be affected by maintenance, connectivity or third-party services. Nothing in these terms excludes rights or remedies that cannot lawfully be excluded.</p></section>
    <section><h2>Closing or changing an invitation</h2><p>You can make a published invitation private and remove individual guest links through the host controls. This does not remove copies previously downloaded or forwarded by recipients. Refer to the privacy policy for information about data handling and requests.</p></section>
  </LegalPage>;
}
