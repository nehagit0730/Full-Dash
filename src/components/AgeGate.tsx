// src/components/AgeGate.tsx
import React, { useEffect, useState, useImperativeHandle, forwardRef, useRef, useCallback } from "react";
import { ShieldCheck, CheckCircle2, Lock, AlertCircle, RefreshCw, X } from "lucide-react";
import { trackAgeVerified } from "../utils/klaviyo";

const AGE_APPROVED_STORAGE_KEY = "agechecked-approved";
const AGE_VERIFIED_STORAGE_KEY = "ageVerified";
const AGE_APPROVED_AT_STORAGE_KEY = "agechecked-verified-at";
// Approvals older than this are treated as expired so a stale flag can't silently re-approve a new attempt
const AGE_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function hasValidStoredApproval(): boolean {
  if (typeof window === "undefined") return false;
  const storedApproved = window.localStorage.getItem(AGE_APPROVED_STORAGE_KEY);
  const storedVerified = window.localStorage.getItem(AGE_VERIFIED_STORAGE_KEY);
  if (storedApproved !== "true" && storedVerified !== "true") return false;

  const verifiedAt = window.localStorage.getItem(AGE_APPROVED_AT_STORAGE_KEY);
  // An approval is only trustworthy if it is tied to a real AgeChecked
  // transaction id, not just a leftover "true" flag in localStorage.
  const storedAgeCheckId = window.localStorage.getItem("agechecked-id");
  if (!storedAgeCheckId) return false;

  const verifiedAtMs = verifiedAt ? Date.parse(verifiedAt) : NaN;
  if (Number.isFinite(verifiedAtMs) && Date.now() - verifiedAtMs > AGE_VERIFICATION_TTL_MS) {
    window.localStorage.removeItem(AGE_APPROVED_STORAGE_KEY);
    window.localStorage.removeItem(AGE_VERIFIED_STORAGE_KEY);
    window.localStorage.removeItem(AGE_APPROVED_AT_STORAGE_KEY);
    // Clear the transaction id too, so an expired verification cannot be
    // revived by a later write of the approved flag alone.
    window.localStorage.removeItem("agechecked-id");
    return false;
  }
  return true;
}

export interface AgeCheckedResponse {
  avstatus?: {
    agecheckid?: number | string;
    ageverifiedid?: number | string;
    status?: number | string;
    statustext?: string;
    statusText?: string;
  };
  url?: string;
  redirectUrl?: string;
  reference?: string;
  message?: string;
  details?: unknown;
  error?: {
    code?: string;
    message?: string;
    details?: string;
  };
  [key: string]: unknown;
}

function getPortalUrl(publicKey: string, returnUrl?: string, customPortalUrl?: string) {
  const baseUrl = 
    customPortalUrl ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.NEXT_PUBLIC_AGECHECKED_PORTAL_URL) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_AGECHECKED_PORTAL_URL) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AGECHECKED_PORTAL_URL) || 
    "https://portal.agechecked.com/portal";

  try {
    const url = new URL(baseUrl);
    if (publicKey && publicKey !== "PUBLIC_KEY") {
      url.searchParams.set("publicKey", publicKey);
    }
    if (returnUrl) {
      url.searchParams.set("returnUrl", returnUrl);
      url.searchParams.set("redirectUrl", returnUrl);
    }
    return url.toString();
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const params = [];
    if (publicKey && publicKey !== "PUBLIC_KEY") {
      params.push(`publicKey=${encodeURIComponent(publicKey)}`);
    }
    if (returnUrl) {
      params.push(`returnUrl=${encodeURIComponent(returnUrl)}`);
      params.push(`redirectUrl=${encodeURIComponent(returnUrl)}`);
    }
    return `${baseUrl}${params.length ? separator + params.join("&") : ""}`;
  }
}

function isApprovedStatus(value?: string | number | null) {
  if (value === undefined || value === null) return false;
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized === "approved" ||
    normalized === "true" ||
    normalized === "6" ||
    normalized === "7" ||
    normalized === "pass" ||
    normalized === "passed" ||
    normalized === "verified" ||
    normalized === "success" ||
    normalized === "completed" ||
    normalized === "complete" ||
    normalized === "valid" ||
    normalized === "ok"
  );
}

function getAgeCheckedMessageOrigins(portalUrl?: string, activeUrl?: string) {
  const origins = new Set([
    "https://agechecked.getid.ee",
    "https://agechecked.sb.getid.dev",
    "https://portal.agechecked.com"
  ]);

  // AgeChecked finishes by redirecting the panel to our own
  // /api/agechecked/callback page, which reports the result back up. Without
  // our origin here that final message is dropped and the panel stays open on
  // the provider's closing screen.
  if (typeof window !== "undefined" && window.location?.origin) {
    origins.add(window.location.origin);
  }

  for (const candidate of [portalUrl, activeUrl]) {
    if (!candidate) continue;
    try {
      origins.add(new URL(candidate).origin);
    } catch (_e) {}
  }

  return origins;
}

export interface AgeGateProps {
  compact?: boolean;
  onApprovedChange?: (approved: boolean) => void;
  customerData?: {
    name?: string;
    surname?: string;
    email?: string;
    postcode?: string;
    countrycode?: string;
    dob?: string;
    reference?: string;
  };
}

export interface AgeGateHandle {
  openPortal: () => Promise<boolean>;
  resetApproval: () => void;
  checkStatus: () => Promise<boolean>;
  isApproved: boolean;
}

export const AgeGate = forwardRef<AgeGateHandle, AgeGateProps>(({ compact = false, onApprovedChange, customerData }, ref) => {
  const [approved, setApproved] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return (
      hasValidStoredApproval() ||
      params.get("agechecked") === "approved" ||
      params.get("approved") === "true" ||
      isApprovedStatus(params.get("status"))
    );
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [activePortalUrl, setActivePortalUrl] = useState<string>("");
  const [showVerificationFrame, setShowVerificationFrame] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState(
    approved
      ? "Your age (18+) has been verified successfully."
      : "Under UK law, 18+ age verification is required before checkout."
  );
  const [agecheckId, setAgecheckId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("agecheckid") || window.localStorage.getItem("agechecked-id") || null;
  });
  const [currentReference, setCurrentReference] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("reference") || null;
  });
  const [serverConfig, setServerConfig] = useState<{ portalUrl?: string; publicKey?: string } | null>(null);
  const [checkStatusNotice, setCheckStatusNotice] = useState<string | null>(null);

  const onApprovedChangeRef = useRef(onApprovedChange);
  useEffect(() => {
    onApprovedChangeRef.current = onApprovedChange;
  }, [onApprovedChange]);

  const activeResolverRef = useRef<((approved: boolean) => void) | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const verificationActiveRef = useRef(false);

  const publicKey = 
    serverConfig?.publicKey ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.NEXT_PUBLIC_AGECHECKED_PUBLIC_KEY) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_AGECHECKED_PUBLIC_KEY) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AGECHECKED_PUBLIC_KEY) || 
    "";

  // Load AgeChecked server configuration
  useEffect(() => {
    fetch('/api/agechecked/config')
      .then(async res => {
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await res.json();
        }
        return null;
      })
      .then(cfg => {
        if (cfg) {
          setServerConfig(cfg);
        }
      })
      .catch(() => {});
  }, []);

  // Handle successful age verification
  const markApproved = useCallback((detail?: AgeCheckedResponse) => {
    if (typeof window === "undefined") return;
    if (!verificationActiveRef.current) return;

    // 1. Immediately store verification in localStorage
    try {
      window.localStorage.setItem(AGE_APPROVED_STORAGE_KEY, "true");
      window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, "true");
      window.localStorage.setItem(AGE_APPROVED_AT_STORAGE_KEY, new Date().toISOString());
    } catch (_e) {}

    const resolvedAgeCheckId = 
      detail?.avstatus?.agecheckid ? String(detail.avstatus.agecheckid) : 
      (detail?.agecheckid ? String(detail.agecheckid) : agecheckId || `AC-${Date.now()}`);
    
    if (resolvedAgeCheckId) {
      setAgecheckId(resolvedAgeCheckId);
      try {
        window.localStorage.setItem("agechecked-id", resolvedAgeCheckId);
      } catch (_e) {}
    }

    // 2. Stop polling and dismiss the verification panel
    if (pollingTimerRef.current) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }

    // 3. Update React states
    setApproved(true);
    setIsVerifying(false);
    setShowVerificationFrame(false);
    setActivePortalUrl("");
    setCheckStatusNotice(null);
    setStatusMessage("Your age (18+) has been verified successfully.");

    // 4. Resolve promise
    if (activeResolverRef.current) {
      activeResolverRef.current(true);
      activeResolverRef.current = null;
    }

    // 5. Notify parent callback
    onApprovedChangeRef.current?.(true);

    // 6. Broadcast event to window & parent
    try {
      window.postMessage(
        {
          type: "AGECHECKED_VERIFIED",
          verified: true,
          approved: true,
          data: detail
        },
        window.location.origin
      );
    } catch (_e) {}

    // Broadcast across tabs/windows
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("agechecked_channel");
        bc.postMessage({
          type: "agechecked-approved",
          status: "approved",
          approved: true,
          verified: true,
          agecheckid: resolvedAgeCheckId,
          email: customerData?.email
        });
        bc.close();
      }
    } catch (_e) {}

    // Persist to server backend database
    if (customerData?.email || currentReference || resolvedAgeCheckId) {
      fetch("/api/agechecked/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: currentReference || customerData?.reference,
          email: customerData?.email,
          agecheckid: resolvedAgeCheckId,
          verified: true
        })
      }).catch(() => {});
    }

    // 7. Klaviyo tracking
    try {
      trackAgeVerified({
        email: customerData?.email || "customer@example.com",
        verified_at: new Date().toISOString(),
      });
    } catch (_e) {}
  }, [customerData?.email, customerData?.reference, currentReference, agecheckId]);

  // Query server status endpoint directly
  const pollServerStatus = useCallback(async (refToTest?: string, idToTest?: string, emailToTest?: string): Promise<boolean> => {
    if (typeof window !== "undefined" && hasValidStoredApproval()) {
      markApproved();
      return true;
    }

    const refParam = refToTest || currentReference || customerData?.reference || "";
    const idParam = idToTest || agecheckId || "";
    const emailParam = emailToTest || customerData?.email || "";

    if (!refParam && !idParam && !emailParam) {
      return false;
    }

    try {
      const queryParams = new URLSearchParams();
      if (refParam) queryParams.set("reference", refParam);
      if (idParam) queryParams.set("agecheckid", idParam);
      if (emailParam) queryParams.set("email", emailParam);

      const res = await fetch(`/api/agechecked/status?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.approved === true || data.status === "6" || data.status === "7" || data.status === "1" || data.success === true) {
          markApproved({
            avstatus: {
              agecheckid: data.agecheckid || idParam || undefined,
              status: data.status || "6",
              statustext: data.statusText || "Approved"
            },
            agecheckid: data.agecheckid
          });
          return true;
        }
      }
    } catch (_e) {}
    return false;
  }, [currentReference, customerData?.reference, customerData?.email, agecheckId, markApproved]);

  // Sync with localStorage & server on mount & when email/reference becomes available
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const isApprovedFromParam =
      hasValidStoredApproval() ||
      params.get("agechecked") === "approved" ||
      params.get("approved") === "true" ||
      isApprovedStatus(params.get("status")) ||
      params.get("status") === "6" ||
      params.get("status") === "7";

    if (isApprovedFromParam && !approved) {
      markApproved({
        avstatus: { agecheckid: params.get("agecheckid") || undefined }
      });
      return;
    }

    if (!approved && isVerifying && agecheckId) {
      pollServerStatus();
    }
  }, [approved, isVerifying, customerData?.email, customerData?.reference, agecheckId, markApproved, pollServerStatus]);

  // Continuous background synchronization & window focus/visibility listeners
  // This automatically detects when the user completes verification on mobile or in the window
  useEffect(() => {
    if (typeof window === "undefined" || approved) return;

    const handleVisibilityOrFocus = () => {
      // Gated on isVerifying: a returning visitor with a still-valid stored
      // approval is already handled by the mount check above. These listeners
      // exist to catch the moment an in-progress verification completes.
      if (isVerifying && hasValidStoredApproval()) {
        markApproved();
        return;
      }
      if (isVerifying && agecheckId) pollServerStatus();
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("pageshow", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    const intervalMs = isVerifying ? 700 : 1400;
    const intervalId = window.setInterval(async () => {
      if (isVerifying && hasValidStoredApproval()) {
        markApproved();
        return;
      }
      if (isVerifying && agecheckId) {
        await pollServerStatus();
      }
    }, intervalMs);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("pageshow", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.clearInterval(intervalId);
    };
  }, [approved, isVerifying, customerData?.email, currentReference, agecheckId, markApproved, pollServerStatus]);

  // Official AgeChecked postMessage listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = getAgeCheckedMessageOrigins(serverConfig?.portalUrl, activePortalUrl);
      if (!allowedOrigins.has(event.origin)) return;
      if (iframeRef.current?.contentWindow && event.source !== iframeRef.current.contentWindow) return;

      let payload = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          const lowerStr = payload.toLowerCase().trim();
          if (
            lowerStr === "agechecked-approved" ||
            lowerStr === "approved" ||
            lowerStr === "agechecked-approved"
          ) {
            markApproved();
            return;
          }
        }
      }

      if (!payload || typeof payload !== "object") return;

      // When getidEventName === "complete", ID capture finished successfully
      if ("getidEventName" in payload) {
        if (payload.getidEventName === "complete" && isVerifying) {
          const resolvedId = payload.data?.id || payload.data?.profileId || payload.data?.agecheckid || agecheckId || undefined;
          if (!resolvedId || (agecheckId && String(resolvedId) !== String(agecheckId))) return;
          markApproved({
            avstatus: {
              agecheckid: resolvedId,
              status: "6",
              statustext: "Approved"
            },
            agecheckid: resolvedId,
            details: payload.data
          });
          return;
        }

        if (payload.getidEventName === "fail") {
          setIsVerifying(false);
          const errorDetail = payload.error?.message || payload.error?.details || (typeof payload.error === "string" ? payload.error : "Age verification attempt was not successful. Please try again.");
          setCheckStatusNotice(errorDetail);
          if (activeResolverRef.current) {
            activeResolverRef.current(false);
            activeResolverRef.current = null;
          }
          return;
        }
      }

      // Event name aliases
      const eventName = payload.eventName || payload.event || payload.action;
      if (eventName) {
        const lowerEvent = String(eventName).toLowerCase();
        if (isVerifying && (
          lowerEvent === "complete" ||
          lowerEvent === "success" ||
          lowerEvent === "approved"
        )) {
          const resolvedId = payload.data?.id || payload.data?.profileId || payload.data?.agecheckid || agecheckId || undefined;
          if (!resolvedId || (agecheckId && String(resolvedId) !== String(agecheckId))) return;
          markApproved({
            avstatus: {
              agecheckid: resolvedId,
              status: "6",
              statustext: "Approved"
            },
            agecheckid: resolvedId,
            details: payload.data
          });
          return;
        }
      }

      // Fallback verification messages
      const isApproved =
        payload.type === "AGECHECKED_VERIFIED" ||
        payload.type === "agechecked-approved" ||
        payload.type === "agechecked_approved" ||
        payload.type === "AC_APPROVED" ||
        payload.type === "getid:complete" ||
        isApprovedStatus(payload.status) ||
        payload.approved === true ||
        payload.approved === "true" ||
        payload.verified === true ||
        (typeof payload.statusText === "string" && isApprovedStatus(payload.statusText)) ||
        (typeof payload.statustext === "string" && isApprovedStatus(payload.statustext)) ||
        (payload.avstatus && (
          isApprovedStatus(payload.avstatus.status) ||
          isApprovedStatus(payload.avstatus.statustext) ||
          isApprovedStatus(payload.avstatus.statusText)
        ));

      if (isVerifying && isApproved && agecheckId) {
        markApproved(payload as AgeCheckedResponse);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if ((e.key === AGE_APPROVED_STORAGE_KEY || e.key === AGE_VERIFIED_STORAGE_KEY) && e.newValue === "true") {
        markApproved();
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("agechecked_channel");
        bc.onmessage = (ev) => {
          if (ev.data && (ev.data.type === "agechecked-approved" || ev.data.approved === true || ev.data.status === "approved" || ev.data.verified === true)) {
            markApproved(ev.data);
          }
        };
      }
    } catch (_e) {}

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      if (bc) {
        bc.close();
      }
    };
  }, [activePortalUrl, agecheckId, isVerifying, markApproved, serverConfig?.portalUrl]);

  const resetApproval = () => {
    if (typeof window === "undefined") return;

    // Must be cleared here: markApproved() early-returns unless this ref is
    // true, so leaving it set would let a late callback approve after a reset.
    verificationActiveRef.current = false;

    // Clear the server-side persisted record too, otherwise the next verification attempt
    // will be silently re-approved from the previously stored reference/email/agecheckid.
    fetch("/api/agechecked/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: currentReference || customerData?.reference,
        email: customerData?.email,
        agecheckid: agecheckId
      })
    }).catch(() => {});

    window.localStorage.removeItem(AGE_APPROVED_STORAGE_KEY);
    window.localStorage.removeItem(AGE_VERIFIED_STORAGE_KEY);
    window.localStorage.removeItem(AGE_APPROVED_AT_STORAGE_KEY);
    window.localStorage.removeItem("agechecked-id");
    if (pollingTimerRef.current) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (activeResolverRef.current) {
      activeResolverRef.current(false);
      activeResolverRef.current = null;
    }
    setApproved(false);
    setIsVerifying(false);
    setActivePortalUrl("");
    setShowVerificationFrame(false);
    setAgecheckId(null);
    setCheckStatusNotice(null);
    setStatusMessage("Under UK law, 18+ age verification is required before checkout.");
    onApprovedChangeRef.current?.(false);
  };

  // Runs AgeChecked AC0130 verification in the in-page panel. There is no
  // separate browser window: the provider needs a top-level-looking surface
  // with camera access, which the panel iframe grants via its allow list.
  const openPortal = async (): Promise<boolean> => {
    if (typeof window === "undefined") return approved;

    // Check localStorage immediately. `agecheckId` is seeded from the same
    // "agechecked-id" key that hasValidStoredApproval() requires, so this pair
    // is equivalent to the stored check while stating the dependency outright.
    if (hasValidStoredApproval() && agecheckId) {
      setApproved(true);
      return true;
    }

    if (approved) return true;

    verificationActiveRef.current = true;
    setIsVerifying(true);
    setCheckStatusNotice(null);
    setStatusMessage("Initializing AgeChecked 18+ ID verification...");

    return new Promise<boolean>(async (resolve) => {
      activeResolverRef.current = resolve;

      try {
        const nameParts = (customerData?.name || "Customer").split(" ");
        const firstName = nameParts[0] || "Customer";
        const lastName = nameParts.slice(1).join(" ") || customerData?.surname || "";
        const sessionRef = customerData?.reference || `ps-ref-${Date.now()}`;
        setCurrentReference(sessionRef);

        const response = await fetch("/api/agechecked/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: firstName,
            surname: lastName,
            dob: customerData?.dob || "01/01/2000",
            postcode: customerData?.postcode || "EC1A 1BB",
            countrycode: customerData?.countrycode || "GB",
            email: customerData?.email || "customer@example.com",
            reference: sessionRef,
            userfield1: sessionRef,
            userfield2: customerData?.email || "",
            withforce: "true",
          }),
        });

        const data = (await response.json()) as AgeCheckedResponse;

        if (!verificationActiveRef.current) {
          resolve(false);
          return;
        }
        
        // Handle error codes from AC0130
        if (data.error && !data.url && !data.redirectUrl) {
          const errCode = data.error.code ? `[Code ${data.error.code}] ` : "";
          const errText = `${errCode}${data.error.message || "AgeChecked initialization error"}${data.error.details ? ` (${data.error.details})` : ""}`;
          setCheckStatusNotice(errText);
          setStatusMessage(errText);
          setIsVerifying(false);
          resolve(false);
          return;
        }

        // Check if AC0130 immediately approved
        const initializedSessionId = data?.avstatus?.agecheckid;
        const isImmediateApproval = Boolean(
          initializedSessionId &&
          (isApprovedStatus(data?.avstatus?.status) ||
            isApprovedStatus(data?.avstatus?.statustext))
        );

        if (isImmediateApproval) {
          markApproved(data);
          resolve(true);
          return;
        }

        let rawRedirectUrl =
          (data as { url?: string }).url ||
          (data as { redirectUrl?: string }).redirectUrl ||
          (data as { redirect_url?: string }).redirect_url;

        if (!rawRedirectUrl && publicKey) {
          rawRedirectUrl = getPortalUrl(
            publicKey,
            `${window.location.origin}/api/agechecked/callback?reference=${encodeURIComponent(sessionRef)}&email=${encodeURIComponent(customerData?.email || '')}&returnUrl=${encodeURIComponent(window.location.href)}`,
            serverConfig?.portalUrl
          );
        }

        if (!rawRedirectUrl) {
          const configurationError = "AgeChecked verification is not configured. Please contact support.";
          setCheckStatusNotice(configurationError);
          setStatusMessage(configurationError);
          setIsVerifying(false);
          resolve(false);
          return;
        }

        try {
          const embeddedUrl = new URL(rawRedirectUrl, window.location.origin);
          embeddedUrl.searchParams.set('embedded', 'true');
          rawRedirectUrl = embeddedUrl.toString();
        } catch (_e) {}

        const resolvedSessionId = data?.avstatus?.agecheckid ? String(data.avstatus.agecheckid) : `AC-${Date.now()}`;
        setAgecheckId(resolvedSessionId);
        setActivePortalUrl(rawRedirectUrl);

        setShowVerificationFrame(true);
        setStatusMessage("AgeChecked 18+ verification in progress. Complete the secure check below.");

        // Start active background polling (every 700ms)
        if (pollingTimerRef.current) {
          window.clearInterval(pollingTimerRef.current);
        }

        // A safety net only. The panel normally closes as soon as the callback
        // page reports back; this catches the case where that message is lost.
        pollingTimerRef.current = window.setInterval(async () => {
          if (hasValidStoredApproval()) {
            if (pollingTimerRef.current) {
              window.clearInterval(pollingTimerRef.current);
              pollingTimerRef.current = null;
            }
            markApproved();
            return;
          }

          const isVerifiedOnServer = await pollServerStatus(sessionRef, resolvedSessionId, customerData?.email);
          if (isVerifiedOnServer) {
            if (pollingTimerRef.current) {
              window.clearInterval(pollingTimerRef.current);
              pollingTimerRef.current = null;
            }
            return;
          }
        }, 700);

      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Age verification connection failed.");
        setIsVerifying(false);
        if (activeResolverRef.current) {
          activeResolverRef.current(false);
          activeResolverRef.current = null;
        }
      }
    });
  };

  useImperativeHandle(ref, () => ({
    openPortal,
    resetApproval,
    checkStatus: () => pollServerStatus(),
    isApproved: approved,
  }), [approved, pollServerStatus]);

  return (
    <>
      {isVerifying && activePortalUrl && showVerificationFrame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6">
          <div className="flex h-[min(760px,calc(100vh-1.5rem))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">AgeChecked 18+ Verification</span>
              <button type="button" onClick={resetApproval} className="text-xs font-bold text-slate-500 hover:text-slate-900">Cancel</button>
            </div>
            <iframe
              ref={iframeRef}
              src={activePortalUrl}
              title="AgeChecked 18+ verification"
              className="min-h-0 flex-1 border-0"
              allow="camera; microphone"
            />
          </div>
        </div>
      )}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
        approved
          ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
          : isVerifying
          ? "border-sky-300 bg-sky-50/90 text-sky-950"
          : "border-amber-200 bg-amber-50/80 text-amber-950"
        }`}
      >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 rounded-xl p-2.5 shrink-0 ${
              approved
                ? "bg-emerald-100 text-emerald-700"
                : isVerifying
                ? "bg-sky-100 text-sky-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {approved ? (
              <ShieldCheck className="h-5 w-5" />
            ) : isVerifying ? (
              <RefreshCw className="h-5 w-5 animate-spin text-sky-700" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  approved
                    ? "text-emerald-800"
                    : isVerifying
                    ? "text-sky-800"
                    : "text-amber-800"
                }`}
              >
                {approved
                  ? "Age Verified (18+ Approved)"
                  : isVerifying
                  ? "Verification In Progress"
                  : "Age Verification Required"}
              </span>
            </div>
            <h3 className="mt-0.5 text-sm font-bold text-slate-900">AgeChecked Official Verification</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{statusMessage}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
              approved
                ? "border-emerald-300 bg-emerald-100/80 text-emerald-800"
                : isVerifying
                ? "border-sky-300 bg-sky-100 text-sky-800"
                : "border-amber-300 bg-amber-100/80 text-amber-800"
            }`}
          >
            {approved ? "Verified" : isVerifying ? "In Progress" : "Pending"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {!approved ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-amber-900/80">
              {isVerifying
                ? "Complete verification in the secure AgeChecked panel. This page updates automatically."
                : "Click 'Verify with AgeChecked' or 'Pay with Worldpay' to complete the 18+ check."}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Identity verified. You are ready to complete checkout.</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!approved ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openPortal()}
                className="text-[11px] font-bold bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying (In Progress)...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verify with AgeChecked</span>
                  </>
                )}
              </button>
              
            </div>
          ) : (
            <button
              type="button"
              onClick={resetApproval}
              className="rounded-lg border border-emerald-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition hover:bg-white cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {checkStatusNotice && (
        <div className="mt-2.5 p-2.5 bg-amber-100/80 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
          <span>{checkStatusNotice}</span>
        </div>
      )}

      {agecheckId && (
        <p className="mt-2 text-[10px] font-mono text-slate-400">
          Ref: {agecheckId}
        </p>
      )}
      </div>
    </>
  );
});

AgeGate.displayName = "AgeGate";
export default AgeGate;
