import Image from "next/image";
import type { InvitationOpening } from "@/types/invitation";
import { openingSceneAssets } from "@/data/opening-scenes";
import styles from "./opening-scene.module.css";

function Art({ src, className = "" }: { src: string; className?: string }) {
  return <span className={`${styles.image} ${className}`}><Image src={src} alt="" fill sizes="(max-width: 480px) 100vw, 420px" draggable={false} /></span>;
}

/** Each piece is a real layer. Only the selected opening animates, once. */
export function OpeningScene({ style, phase = "closed", compact = false }: { style: InvitationOpening["style"]; phase?: "closed" | "opening" | "open"; compact?: boolean }) {
  const scene = style === "theme" ? "doors" : style;
  return <div className={styles.scene} data-opening-scene={scene} data-scene-phase={phase} data-scene-compact={compact} aria-hidden="true">
    {(scene === "doors" || scene === "flowers") && <>
      <Art src={openingSceneAssets.paper} className={styles.revealPaper} />
      <span className={styles.revealLight} />
      <div className={styles.leftPanel} data-opening-part="left"><Art src={openingSceneAssets[scene]} className={styles.doubleImage} /></div>
      <div className={styles.rightPanel} data-opening-part="right"><Art src={openingSceneAssets[scene]} className={styles.doubleImage} /></div>
      {scene === "doors" && <span className={styles.doorSeam} />}
    </>}
    {scene === "mandap" && <>
      <Art src={openingSceneAssets.mandap} className={styles.stageImage} />
      <div className={`${styles.curtain} ${styles.curtainLeft}`} data-opening-part="left" />
      <div className={`${styles.curtain} ${styles.curtainRight}`} data-opening-part="right" />
      <div className={styles.curtainValance} /><span className={styles.curtainTie} />
    </>}
    {(scene === "bike" || scene === "car") && <>
      <Art src={openingSceneAssets.flowers} className={styles.arrivalGarden} />
      <span className={styles.arrivalHaze} /><span className={styles.terrace} />
      <div className={styles.movingVehicle} data-opening-part="vehicle"><Art src={openingSceneAssets[scene]} /></div>
    </>}
    {scene === "sky" && <>
      <span className={styles.skyGlow} /><span className={styles.moon} data-opening-part="center" />
      <span className={styles.stars} />
      <div className={`${styles.cloud} ${styles.cloudFar}`} data-opening-part="left" />
      <div className={`${styles.cloud} ${styles.cloudNear}`} data-opening-part="right" />
      <span className={styles.skyHorizon} />
    </>}
    {scene === "rings" && <>
      <Art src={openingSceneAssets.paper} className={styles.ringsPaper} />
      <span className={styles.ringShadow} />
      <span className={`${styles.ring} ${styles.ringLeft}`} data-opening-part="left" />
      <span className={`${styles.ring} ${styles.ringRight}`} data-opening-part="right"><span className={styles.diamond} /></span>
      <span className={styles.ribbon} />
    </>}
    {scene === "envelope" && <>
      <Art src={openingSceneAssets.paper} />
      <span className={styles.envelopeSide} /><span className={styles.envelopeFlap} /><span className={styles.envelopeSeal}><span>♡</span></span>
    </>}
    {scene === "none" && <><Art src={openingSceneAssets.paper} /><span className={styles.plainCard}><i /><i /><b>♥</b><i /></span></>}
  </div>;
}
