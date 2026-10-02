"use client";

import { useEffect, useState } from "react";

export function Countdown({ date, initialRemaining }: { date: string; initialRemaining: number }) {
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
      <p className="eyebrow">{remaining === 0 ? "The celebration has begun" : "Counting the moments"}</p>
      <div className="countdown" aria-label="Time until the event">
        {["Days", "Hours", "Minutes", "Seconds"].map((label, index) => (
          <div className="countdown-unit" key={label}>
            <span className="countdown-number">{values[index] === null ? "—" : String(values[index]).padStart(2, "0")}</span>
            <span className="countdown-label">{label}</span>
          </div>
        ))}
      </div>
      <noscript><p>Celebrate with us on {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}.</p></noscript>
    </div>
  );
}
