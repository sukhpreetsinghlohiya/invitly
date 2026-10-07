import Link from "next/link";
import { PHOTO_UPLOAD_MAX_LABEL } from "@/lib/photo-upload";
import { getOccasionThemes } from "@/data/occasion-themes";

const questions = [
  { question: "Do my guests need an app or an account?", answer: "No. Guests open your published invitation in their phone or desktop browser, straight from a WhatsApp message or any link you share. There is nothing to install and no guest account to create." },
  { question: "Can I start designing before I sign up?", answer: "Yes. Explore a demo, choose a design, and try your details in the editor. Save draft keeps an unsigned-in draft in this browser on this device. Sign in to save it to your host account, upload photos, and publish a link your guests can open." },
  { question: "Which occasions and traditions can I choose?", answer: `Choose from ${getOccasionThemes("wedding").length} wedding designs and ${getOccasionThemes("engagement").length} engagement designs today. Birthdays, baby showers, housewarmings, naming ceremonies, anniversaries, remembrance events and other gatherings are coming soon. Choose an optional tradition or stay neutral. Your names never determine your religion. You can edit or remove suggested phrases and switch decorative artwork off.` },
  { question: "Can I change an invitation after sharing it?", answer: "Yes. Open it from your dashboard, make your changes, and save. Guests see the updated invitation at the same published link. You can also make the invitation private again. If you change the invitation’s web address, remember to share that new link with your guests." },
  { question: "How do guest RSVPs work?", answer: "Create guests and their personal invitation links from your host dashboard. Those links show each guest’s permitted schedule and let them send one RSVP for their party, including attendance, party size, and a note. You can review responses in your account. Your general invitation link is for sharing the event details; demo RSVPs stay in the browser and are not sent to a host." },
  { question: "Can I add a Google Maps location?", answer: "Yes. Add a venue and address to each function, then paste its Google Maps share link to point guests to the exact place. Guests can tap Directions or copy the address from the invitation. Different functions can have different venues." },
  { question: "Can I use my own photos and a song?", answer: `Once your invitation is saved to your account, upload JPG, PNG, or WebP photos up to ${PHOTO_UPLOAD_MAX_LABEL} each and choose a cover image. Choose a wedding song, an original instrumental mood, or an official YouTube video. You can also upload your own MP3 up to 10 MB and 15 minutes, then save it with your invitation. On your published invitation, guests choose when to play music. Our demos try to play music automatically; if the browser asks for a tap first, open the invitation or use Play music.` },
  { question: "Can I check how it looks before publishing?", answer: "Absolutely. The editor shows your actual invitation in phone and desktop previews. Check your wording, dates, schedule, photos, and directions, then publish when you are ready. Switching between designs keeps your content, so you can find the one that feels right." },
];

/** Native disclosure controls work with a keyboard and without client JavaScript. */
export function FrequentlyAskedQuestions() {
  return <section id="faqs" className="marketing-faq container" aria-labelledby="faq-heading">
    <div className="faq-intro"><span className="eyebrow">BEFORE THE FIRST INVITE</span><h2 id="faq-heading">A few little things,<br /><em>answered.</em></h2><p>From your first draft to the family group, here’s how it all comes together.</p><Link href="/customize" className="faq-start-link">Try the invitation editor <span aria-hidden="true">↗</span></Link><span className="faq-intro-note">Take your time. Make it yours.</span></div>
    <div className="faq-list">{questions.map((item, index) => <details key={item.question} className="faq-item"><summary><span className="faq-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span>{item.question}</span><span className="faq-toggle" aria-hidden="true" /></summary><div className="faq-answer"><p>{item.answer}</p></div></details>)}</div>
  </section>;
}
