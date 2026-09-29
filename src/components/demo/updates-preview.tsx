"use client";

import { useState } from "react";

type Update = { id: string; time: string; message: string };

export function UpdatesPreview({ updates }: { updates: Update[] }) {
  const [simulated, setSimulated] = useState(false);
  return <div className="updates-preview">
    <div className="update-feed">
      {updates.map((update) => <article className="update-card" key={update.id}>
        <span className="update-dot" aria-hidden="true" />
        <div><p className="update-time">{update.time}</p><p>{update.message}</p></div>
      </article>)}
      <div aria-live="polite" aria-atomic="true">
        {simulated && <article className="update-card update-card-new">
          <span className="update-dot" aria-hidden="true" />
          <div><p className="update-time">Just now · Simulated update</p><p>The sangeet dance floor is ready! Meet us on the Celebration Lawn at 7 pm.</p></div>
        </article>}
      </div>
    </div>
    <button className="button button-secondary" type="button" onClick={() => setSimulated((value) => !value)}>{simulated ? "Reset demo update" : "Simulate a live update"} <span aria-hidden="true">↗</span></button>
    <p className="demo-disclaimer">A local preview of event updates. No live host connection in this demo.</p>
  </div>;
}
