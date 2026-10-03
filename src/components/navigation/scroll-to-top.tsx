"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";
import "./navigation.css";
export function ScrollToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 900);
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);
  // Editor and embedded preview have their own scroll containers and controls.
  if (!visible || pathname === "/preview" || pathname === "/customize") return null;
  return <button type="button" className="scroll-to-top" aria-label="Back to top" onClick={() => { window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); const main = document.getElementById("main"); if (main) { const previous = main.getAttribute("tabindex"); main.setAttribute("tabindex", "-1"); main.focus({ preventScroll: true }); main.addEventListener("blur", () => { if (previous === null) main.removeAttribute("tabindex"); else main.setAttribute("tabindex", previous); }, { once: true }); } }}><ArrowUp size={19} /></button>;
}
