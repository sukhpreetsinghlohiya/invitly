import { InvitationImage } from "@/components/invitation-image";
import { getDesign } from "@/data/occasions";
import { hasIndicText } from "@/lib/invitation-text";
import type { Invitation } from "@/types/invitation";
import type { EventPhoto } from "@/types/media";
import styles from "./couple-profiles.module.css";

type Props = { invitation: Invitation; photos?: EventPhoto[] };

/** Two stems tied together, drawn for this section and tinted by the invitation. */
function TogetherBloom() {
  return <svg className={styles.bloom} viewBox="0 0 140 190" fill="none" aria-hidden="true" focusable="false" data-decoration>
    <g className={styles.bloomStem}>
      <path d="M39 53C38 91 74 118 81 176M99 69C103 108 62 137 60 179" />
      <path d="M50 100C35 94 28 82 27 72M71 137C97 127 114 105 116 93M69 131C47 126 35 115 31 103M94 102C105 95 112 85 111 77" />
    </g>
    <g className={styles.bloomLeaf}>
      <path d="M50 100C33 103 16 91 17 78C33 79 47 86 50 100Z" />
      <path d="M56 111C48 95 53 80 65 76C71 90 67 103 56 111Z" />
      <path d="M79 132C79 116 90 104 104 105C103 119 94 130 79 132Z" />
      <path d="M98 116C109 116 122 107 124 96C112 96 102 103 98 116Z" />
      <path d="M61 128C43 131 29 122 26 111C40 109 55 116 61 128Z" />
      <path d="M64 148C77 146 91 150 95 158C82 163 71 158 64 148Z" />
    </g>
    <g className={styles.bloomDetail}>
      <path d="M20 82L46 98M62 81L57 105M100 109L83 127M120 100L103 112M30 114L57 125M69 151L90 156" />
    </g>
    <g className={styles.bloomPetal}>
      <path d="M39 54C24 62 17 50 25 42C8 39 15 23 28 26C23 10 40 7 44 22C54 9 67 22 57 33C74 38 65 54 51 47C53 61 43 66 39 54Z" />
      <path d="M99 68C86 78 76 69 82 59C65 59 67 44 82 44C71 31 86 22 95 36C97 19 114 23 112 39C127 33 134 48 119 55C132 64 120 78 109 66C107 80 96 80 99 68Z" />
    </g>
    <g className={styles.bloomDetail}>
      <path d="M38 38L30 29M38 38L41 23M41 39L55 34M42 43L49 49M36 43L26 47M98 51L85 45M99 48L96 36M103 49L113 41M105 54L118 57M99 57L100 69M94 54L83 61" />
    </g>
    <circle className={styles.bloomHeart} cx="39" cy="41" r="6" />
    <circle className={styles.bloomHeart} cx="100" cy="53" r="6" />
    <g className={styles.bloomStem}>
      <path d="M66 147C49 130 39 139 47 148C53 153 61 151 70 149C81 136 95 138 90 147C87 153 77 152 70 149M66 150C61 160 49 161 43 168M71 151C75 164 92 163 95 172" />
      <path d="M33 70L29 63M111 80L118 75" />
    </g>
  </svg>;
}

/** Portrait choices resolve only against this invitation's authorized photo collection. */
export function CoupleProfiles({ invitation, photos = [] }: Props) {
  const occasion = invitation.occasion || "wedding";
  const people = invitation.couple.map((name, index) => ({ name, index })).filter(person => person.name.trim());
  if (!["wedding", "engagement", "anniversary"].includes(occasion) || !people.length) return null;
  const design = getDesign(invitation);
  const heading = invitation.profileSection?.heading ?? (occasion === "anniversary" ? "Still, side by side." : occasion === "engagement" ? "The beginning of our story." : "At the heart of our day.");
  const showPhotos = invitation.profileSection?.showPhotos ?? true;

  return <section id="families" className={styles.section} data-section="people" data-couple-profiles data-occasion={occasion} aria-labelledby={heading ? "couple-profiles-title" : undefined} aria-label={heading ? undefined : "The two of us"}>
    <header className={styles.heading} data-reveal>
      <span className={styles.eyebrow}>THE TWO OF US</span>
      {heading && <h2 id="couple-profiles-title" data-indic={hasIndicText(heading) || undefined}>{heading}</h2>}
      <p>And the people who have loved us along the way.</p>
    </header>
    <div className={styles.profiles} data-single={people.length === 1 || undefined}>
      {people.map(({ name, index }) => {
        const profile = invitation.personProfiles?.[index];
        const photo = showPhotos ? photos.find(item => item.id === profile?.photoId) : undefined;
        const family = invitation.families[index];
        const grandparents = profile?.grandparents;
        return <article className={styles.profile} data-person-profile={index} data-reveal key={index} aria-labelledby={`person-profile-${index}-name`}>
          {photo && <div className={styles.portraitFrame} data-person-portrait>
            <div className={styles.portrait} data-profile-photo={photo.id}>
              <InvitationImage src={photo.url} alt={photo.alt || `Portrait of ${name}`} width={photo.width} height={photo.height} sizes="(max-width: 560px) 200px, (max-width: 760px) 30vw, 220px" />
            </div>
          </div>}
          <div className={styles.identity}>
            <h3 id={`person-profile-${index}-name`} data-indic={hasIndicText(name) || undefined} data-long-name={Array.from(name).length > 24 || undefined}>{name}</h3>
            {(family || grandparents) && <dl className={styles.family}>
              {family && <div>
                <dt className={profile?.parentsPrefix === "" ? "sr-only" : undefined} data-profile-prefix={profile?.parentsPrefix !== undefined || undefined} data-indic={hasIndicText(profile?.parentsPrefix || "") || undefined}>{profile?.parentsPrefix || "Parents & family"}</dt>
                <dd data-indic={hasIndicText(family) || undefined}>{family}</dd>
              </div>}
              {grandparents && <div>
                <dt className={profile?.grandparentsPrefix === "" ? "sr-only" : undefined} data-profile-prefix={profile?.grandparentsPrefix !== undefined || undefined} data-indic={hasIndicText(profile?.grandparentsPrefix || "") || undefined}>{profile?.grandparentsPrefix || "Grandparents"}</dt>
                <dd data-indic={hasIndicText(grandparents) || undefined}>{grandparents}</dd>
              </div>}
            </dl>}
          </div>
        </article>;
      })}
      {people.length > 1 && <div className={styles.joiningMark} aria-hidden="true" data-reveal>
        {design.decoration && <TogetherBloom />}
        <span>&amp;</span>
      </div>}
    </div>
  </section>;
}
