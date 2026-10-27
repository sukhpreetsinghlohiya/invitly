"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  planId: "pro";
  className?: string;
  children: React.ReactNode;
  isAuthed: boolean;
  billingReady: boolean;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { email?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = { open: () => void };
type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window { Razorpay?: RazorpayCtor }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) { existing.addEventListener("load", () => resolve(Boolean(window.Razorpay))); existing.addEventListener("error", () => resolve(false)); return; }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function UpgradeButton({ planId, className, children, isAuthed, billingReady }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleClick = useCallback(async () => {
    if (!isAuthed) { router.push(`/login?next=${encodeURIComponent("/pricing")}`); return; }
    if (!billingReady) { setStatus("error"); setMessage("Payments are not configured yet."); return; }
    setStatus("loading"); setMessage("");

    const scriptReady = await loadRazorpayScript();
    if (!scriptReady || !window.Razorpay) { setStatus("error"); setMessage("Checkout couldn’t load. Please try again."); return; }

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus("error"); setMessage(data?.error ?? "We couldn’t start checkout."); return;
    }
    const order = await response.json();

    const options: RazorpayOptions = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Invitly",
      description: order.planName,
      order_id: order.orderId,
      prefill: { email: order.userEmail || undefined },
      theme: { color: "#58252f" },
      handler: async (payload) => {
        setStatus("loading"); setMessage("Confirming your payment…");
        const verify = await fetch("/api/billing/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!verify.ok) {
          const data = await verify.json().catch(() => ({}));
          setStatus("error"); setMessage(data?.error ?? "We received your payment but couldn’t confirm it. Please contact support.");
          return;
        }
        router.push("/dashboard/plan?welcome=pro");
        router.refresh();
      },
      modal: { ondismiss: () => setStatus("idle") },
    };
    new window.Razorpay(options).open();
  }, [billingReady, isAuthed, planId, router]);

  return <>
    <button type="button" onClick={handleClick} disabled={status === "loading"} className={className}>
      {status === "loading" ? "Opening checkout…" : children}
    </button>
    {status === "error" && message ? <p className="pricing-error" role="alert">{message}</p> : null}
  </>;
}
