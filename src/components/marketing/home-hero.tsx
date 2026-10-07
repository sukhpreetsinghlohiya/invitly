import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Flower } from "@/components/brand";
import { StationeryCard } from "./stationery-art";
import "./home-hero.css";

function BotanicalThread() {
  return <svg className="stationery-thread" viewBox="0 0 1440 100" fill="none" aria-hidden="true" preserveAspectRatio="none">
    <path d="M-15 65C115 138 179-20 316 43S492 87 603 42S781 112 908 54S1113 13 1210 52S1374 117 1455 6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M-20 82C123 28 223 104 331 62S515 102 627 64S797 18 923 67S1115 103 1228 50S1360 23 1455 70" stroke="currentColor" strokeWidth="1" opacity=".48" />
  </svg>;
}

/** Server-rendered stationery scene; only CSS transforms animate. */
export function HomeHero() {
  return <div className="stationery-hero-wrap">
    <Image className="stationery-botanical stationery-botanical-left" src="/images/marketing/marigold-branch.webp" alt="" aria-hidden="true" width={600} height={900} sizes="(max-width: 360px) 115px, (max-width: 760px) 140px, (max-width: 1100px) 170px, (max-width: 1588px) 17vw, 270px" loading="eager" fetchPriority="low" />
    <Image className="stationery-botanical stationery-botanical-right" src="/images/marketing/marigold-branch.webp" alt="" aria-hidden="true" width={600} height={900} sizes="(max-width: 360px) 110px, (max-width: 760px) 130px, (max-width: 1100px) 145px, 170px" loading="lazy" fetchPriority="low" />
    <section className="hero stationery-hero container" aria-labelledby="home-title">
      <div className="stationery-hero-copy">
        <span className="eyebrow stationery-kicker"><span />FOR YOUR PEOPLE. FOR YOUR MOMENTS.</span>
        <h1 id="home-title">A little link.<br />A lot of<br /><em>togetherness.</em></h1>
        <p className="stationery-description">For the moments that bring us close. Create a thoughtful wedding or engagement invitation with your story, schedule, directions and RSVPs, all in one beautiful link.</p>
        <div className="stationery-hero-actions"><Link href="/templates#occasion-collections-title" className="button">Create your invitation <ArrowRight size={18} aria-hidden="true" /></Link><Link href="/demo" className="text-link">Open a live invitation <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
        <p className="stationery-small-note">Your first 2 invitations free · Photos, music & RSVPs included.</p>
      </div>
      <div className="stationery-scene">
        <span className="stationery-scene-label"><Flower /><span>MADE FOR YOUR MOMENTS</span><i /></span>
        <Link href="/demo" className="stationery-stack" aria-label="Open the live wedding invitation demo">
          <StationeryCard variant="mehndi" className="stationery-stack-card stationery-stack-left" />
          <StationeryCard variant="engagement" className="stationery-stack-card stationery-stack-right" />
          <StationeryCard variant="wedding" className="stationery-stack-card stationery-stack-front" />
          <Flower className="stationery-scatter stationery-scatter-one" /><Flower className="stationery-scatter stationery-scatter-two" /><Flower className="stationery-scatter stationery-scatter-three" />
        </Link>
        <Link href="/demo" className="stationery-demo-link"><span className="stationery-demo-dot" /> Step inside the invitation <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </div>
    </section>
    <BotanicalThread />
    <Flower className="stationery-thread-flower stationery-thread-flower-one" /><Flower className="stationery-thread-flower stationery-thread-flower-two" />
  </div>;
}
