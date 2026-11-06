import React from 'react';
import { ShieldAlert, LogIn } from 'lucide-react';

interface AdminSessionExpiredModalProps {
  /** Why the session ended, for the wording. */
  reason: 'expired' | 'rejected';
  /** Clears the session and returns to the sign-in screen. */
  onSignInAgain: () => void;
}

/**
 * Tells the administrator, unambiguously, that their session is over.
 *
 * Deliberately blocking and with no dismiss: the dashboard behind it can no
 * longer talk to the API, so leaving it reachable would only let someone keep
 * working against data that cannot load or save. The symptom this replaces is
 * an admin coming back to a tab left open overnight, seeing a dashboard that
 * looks fine, and finding panels empty and saves failing with no explanation.
 */
export const AdminSessionExpiredModal: React.FC<AdminSessionExpiredModalProps> = ({
  reason,
  onSignInAgain
}) => (
  <div
    className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="admin-session-expired-title"
  >
    <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
            <ShieldAlert className="h-5.5 w-5.5" />
          </span>
          <div>
            <h2 id="admin-session-expired-title" className="text-base font-black text-slate-900">
              Session Expired
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Admin dashboard
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          {reason === 'expired'
            ? 'Your admin session has expired. For security, an admin sign-in lasts 8 hours, so a dashboard left open overnight needs signing in again.'
            : 'Your admin session is no longer valid, so the server has stopped accepting it.'}
        </p>

        <p className="text-sm text-slate-600 leading-relaxed">
          Nothing on this page is loading or saving any more. Please sign in again to
          continue — any unsaved changes on screen will be lost.
        </p>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">
        <button
          type="button"
          onClick={onSignInAgain}
          autoFocus
          className="py-2.5 px-5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-black rounded-lg cursor-pointer transition-all shadow-2xs uppercase tracking-widest flex items-center gap-2"
        >
          <LogIn className="h-3.5 w-3.5" />
          Log in again
        </button>
      </div>
    </div>
  </div>
);

export default AdminSessionExpiredModal;
