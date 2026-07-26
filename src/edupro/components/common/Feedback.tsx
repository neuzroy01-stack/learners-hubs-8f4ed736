import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, ShieldAlert } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  requireReason?: boolean;
  reasonLabel?: string;
}

interface FeedbackApi {
  notify: (kind: ToastKind, title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<{ ok: boolean; reason: string }>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export const useFeedback = (): FeedbackApi => {
  const ctx = useContext(FeedbackContext);
  if (ctx) return ctx;
  // Fallback so components still work outside the provider.
  return {
    notify: (kind, title, message) => console.log(`[${kind}] ${title}`, message || ''),
    confirm: async (opts) => ({ ok: window.confirm(`${opts.title}\n\n${opts.message}`), reason: '' })
  };
};

const toneStyles: Record<ToastKind, { icon: React.ElementType; ring: string; text: string; bg: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200 dark:border-emerald-900', text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  error: { icon: XCircle, ring: 'border-rose-200 dark:border-rose-900', text: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40' },
  warning: { icon: AlertTriangle, ring: 'border-amber-200 dark:border-amber-900', text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  info: { icon: Info, ring: 'border-blue-200 dark:border-blue-900', text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40' }
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { resolve: (r: { ok: boolean; reason: string }) => void }) | null
  >(null);
  const [reason, setReason] = useState('');

  const notify = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setReason('');
    return new Promise<{ ok: boolean; reason: string }>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const api = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  const closeConfirm = (ok: boolean) => {
    if (!confirmState) return;
    confirmState.resolve({ ok, reason: reason.trim() });
    setConfirmState(null);
    setReason('');
  };

  const danger = confirmState?.tone !== 'primary';

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 z-[120] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((toast) => {
          const style = toneStyles[toast.kind];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-2xl border ${style.ring} ${style.bg} p-3 shadow-lg backdrop-blur`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{toast.title}</p>
                {toast.message && <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">{toast.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className={`rounded-xl p-2 ${danger ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50' : 'bg-blue-100 text-blue-600 dark:bg-blue-950/50'}`}>
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{confirmState.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{confirmState.message}</p>
              </div>
            </div>

            {confirmState.requireReason && (
              <div className="mt-4">
                <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {confirmState.reasonLabel || 'Reason (recorded in audit log)'}
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Duplicate entry created by mistake"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmState.requireReason && reason.trim().length < 3}
                onClick={() => closeConfirm(true)}
                className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                  danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmState.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};
