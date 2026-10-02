"use client";

import { InvitationImage } from "@/components/invitation-image";
import type { Invitation, PersonProfile } from "@/types/invitation";
import type { EventPhoto } from "@/types/media";
import styles from "./person-profile-fields.module.css";

type Props = { invitation: Invitation; photos: EventPhoto[]; onChange: (patch: Partial<Invitation>) => void; onChoosePhotos: () => void };

export function PersonProfileFields({ invitation, photos, onChange, onChoosePhotos }: Props) {
  function currentProfiles(): [PersonProfile, PersonProfile] { return [{ parentsPrefix: "S/o", grandparentsPrefix: "GS/o", ...invitation.personProfiles?.[0] }, { parentsPrefix: "D/o", grandparentsPrefix: "GD/o", ...invitation.personProfiles?.[1] }]; }
  function changeProfile(index: 0 | 1, patch: PersonProfile) {
    const profiles = currentProfiles();
    profiles[index] = { ...profiles[index], ...patch };
    onChange({ personProfiles: profiles });
  }
  return <section className={styles.section} aria-labelledby="person-profile-fields-title">
    <div className={styles.heading}><h3 id="person-profile-fields-title">Your two portrait cards.</h3><p>Introduce each person and the family beside them. Every detail is optional.</p></div>
    <label className="form-field">Portrait section heading<input maxLength={120} value={invitation.profileSection?.heading ?? (invitation.occasion === "anniversary" ? "Still, side by side." : invitation.occasion === "engagement" ? "The beginning of our story." : "At the heart of our day.")} onChange={event => onChange({ profileSection: { ...invitation.profileSection, heading: event.target.value } })} /><small>Change this line, or leave it blank to omit the heading.</small></label>
    <label className="editor-toggle"><input type="checkbox" checked={invitation.profileSection?.showPhotos ?? true} onChange={event => onChange({ profileSection: { ...invitation.profileSection, showPhotos: event.target.checked } })} /><span><strong>Show portraits</strong><small>Keep both names and family details when photos are hidden.</small></span></label>
    <div className={styles.grid}>{([0, 1] as const).map(index => {
      const label = index === 0 ? "First person" : "Second person";
      const profile = invitation.personProfiles?.[index];
      const photo = photos.find(item => item.id === profile?.photoId);
      return <fieldset className={styles.person} key={index}>
        <legend><span>{index === 0 ? "01" : "02"}</span>{invitation.couple[index] || label}</legend>
        <label className="form-field">{label}’s parents / family (optional)<input value={invitation.families[index]} maxLength={120} onChange={event => {
          const families: [string, string] = [...invitation.families];
          families[index] = event.target.value;
          onChange({ families, personProfiles: currentProfiles() });
        }} /></label>
        <label className="form-field">{label}’s parents prefix<input value={profile?.parentsPrefix ?? (index === 0 ? "S/o" : "D/o")} maxLength={60} onChange={event => changeProfile(index, { parentsPrefix: event.target.value })} /><small>For example: S/o, D/o, child of, or your own wording.</small></label>
        <label className="form-field">{label}’s grandparents (optional)<input value={profile?.grandparents || ""} maxLength={240} onChange={event => changeProfile(index, { grandparents: event.target.value })} /></label>
        <label className="form-field">{label}’s grandparents prefix<input value={profile?.grandparentsPrefix ?? (index === 0 ? "GS/o" : "GD/o")} maxLength={60} onChange={event => changeProfile(index, { grandparentsPrefix: event.target.value })} /></label>
        <label className="form-field">{label}’s portrait<select value={photo?.id || ""} disabled={!photos.length} onChange={event => changeProfile(index, { photoId: event.target.value })}>
          <option value="">No portrait</option>{photos.map(item => <option key={item.id} value={item.id}>{item.alt}</option>)}
        </select></label>
        {photo && <div className={styles.selectedPhoto}><InvitationImage src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} sizes="80px" /><span>Selected for {invitation.couple[index] || label.toLowerCase()}</span></div>}
      </fieldset>;
    })}</div>
    <div className={styles.photoHelp}><p>{photos.length ? "Choose a different portrait for each card from your uploaded photos." : "Upload your portraits in Photos, then choose which person each photo belongs to."}</p><button type="button" className="text-link" onClick={onChoosePhotos}>{photos.length ? "Manage portrait photos" : "Add portraits in Photos"}<span aria-hidden="true">↗</span></button></div>
  </section>;
}
