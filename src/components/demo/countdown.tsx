"use client";

import { useEffect, useState } from "react";

export function Countdown({ date, initialRemaining, timezone = "Asia/Kolkata" }: { date: string; initialRemaining: number; timezone?: string }) {
  // The server supplies the initial value, so the countdown is useful before
  // hydration and the first client render exactly matches the HTML.
  const [remaining, setRemaining] = useState(initialRemaining);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, new Date(date).getTime() - Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [date]);

  const seconds = remaining === null ? null : Math.floor(remaining / 1000);
  const values = seconds === null ? [null, null, null, null] : [
    Math.floor(seconds / 86400),
    Math.floor((seconds % 86400) / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ];

  return (
    <div className="countdown-wrap">
      <p className="eyebrow">{remaining === 0 ? "The countdown is complete" : "Counting the moments"}</p>
      <div className="countdown" aria-label="Time until the countdown ends">
        {["Days", "Hours", "Minutes", "Seconds"].map((label, index) => (
          <div className="countdown-unit" key={label}>
            <span className="countdown-number">{values[index] === null ? "—" : String(values[index]).padStart(2, "0")}</span>
            <span className="countdown-label">{label}</span>
          </div>
        ))}
      </div>
      <noscript><p>Countdown ends on {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: timezone })}.</p></noscript>
    </div>
  );
}
