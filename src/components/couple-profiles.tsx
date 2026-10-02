import { ArchiveOrnament } from "@/components/archive-ornament";
import { InvitationImage } from "@/components/invitation-image";
import { getDesign } from "@/data/occasions";
import { hasIndicText } from "@/lib/invitation-text";
import type { Invitation } from "@/types/invitation";
import type { EventPhoto } from "@/types/media";
import styles from "./couple-profiles.module.css";

type Props = { invitation: Invitation; photos?: EventPhoto[] };

/** Portrait choices resolve against this invitation's authorized photo collection. */
export function CoupleProfiles({ invitation, photos = [] }: Props) {
  const occasion = invitation.occasion || "wedding";
  if (!["wedding", "engagement", "anniversary"].includes(occasion) || !invitation.couple.some(name => name.trim())) return null;
  const design = getDesign(invitation);
  const heading = invitation.profileSection?.heading ?? (occasion === "anniversary" ? "Still, side by side." : occasion === "engagement" ? "The beginning of our story." : "At the heart of our day.");
  const showPhotos = invitation.profileSection?.showPhotos ?? true;
  return <section id="families" className={styles.section} data-section="people" data-couple-profiles data-occasion={occasion} aria-labelledby={heading ? "couple-profiles-title" : undefined} aria-label={heading ? undefined : "The two of us"}>
    <header className={styles.heading} data-reveal><span className={styles.eyebrow}>THE TWO OF US</span>{heading && <h2 id="couple-profiles-title" data-indic={hasIndicText(heading) || undefined}>{heading}</h2>}<p>And the people who have loved us along the way.</p></header>
    <div className={styles.profiles}>{invitation.couple.map((name, index) => {
      if (!name.trim()) return null;
      const profile = invitation.personProfiles?.[index];
      const photo = photos.find(item => item.id === profile?.photoId);
      const family = invitation.families[index];
      const grandparents = profile?.grandparents;
      const initial = name.trim().match(/[\p{L}\p{N}]/u)?.[0] || "";
      return <article className={styles.profile} data-person-profile={index} data-reveal key={index} aria-labelledby={`person-profile-${index}-name`}>
        {showPhotos && <div className={styles.portraitFrame} data-person-portrait>
          <span className={styles.number} aria-hidden="true">{index === 0 ? "01" : "02"}</span>
          {photo ? <div className={styles.portrait} data-profile-photo={photo.id}><InvitationImage src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 650px) 84vw, (max-width: 1000px) 40vw, 400px" /></div>
            : <div className={`${styles.portrait} ${styles.monogram}`} aria-hidden="true"><span data-indic={hasIndicText(initial) || undefined}>{initial}</span>{design.decoration && <ArchiveOrnament kind="branch" className={styles.monogramBranch} />}</div>}
          {design.decoration && <div className={styles.corner} data-decoration aria-hidden="true"><ArchiveOrnament kind="flourish" /></div>}
        </div>}
        <div className={styles.identity}><h3 id={`person-profile-${index}-name`} data-indic={hasIndicText(name) || undefined}>{name}</h3>
          {(family || grandparents) && <dl className={styles.family}>
            {family && <div><dt className={profile?.parentsPrefix === "" ? "sr-only" : undefined} data-profile-prefix={profile?.parentsPrefix !== undefined || undefined} data-indic={hasIndicText(profile?.parentsPrefix || "") || undefined}>{profile?.parentsPrefix || "Parents & family"}</dt><dd data-indic={hasIndicText(family) || undefined}>{family}</dd></div>}
            {grandparents && <div><dt className={profile?.grandparentsPrefix === "" ? "sr-only" : undefined} data-profile-prefix={profile?.grandparentsPrefix !== undefined || undefined} data-indic={hasIndicText(profile?.grandparentsPrefix || "") || undefined}>{profile?.grandparentsPrefix || "Grandparents"}</dt><dd data-indic={hasIndicText(grandparents) || undefined}>{grandparents}</dd></div>}
          </dl>}
        </div>
      </article>;
    })}</div>
    {design.decoration && <span className={styles.joiningMark} aria-hidden="true" data-decoration>&amp;</span>}
  </section>;
}
