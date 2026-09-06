import React, { useMemo, useState } from 'react';
import { Bell, BellOff, CheckCheck, BookOpen, User } from 'lucide-react';
import { useNotifications, timeAgo } from '../../hooks/useNotifications';

type Filter = 'all' | 'unread' | 'read';

export const NotificationsView: React.FC = () => {
  const { items, unreadCount, loading, error, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>('all');

  const shown = useMemo(() => {
    if (filter === 'unread') return items.filter((n) => !n.read);
    if (filter === 'read') return items.filter((n) => n.read);
    return items;
  }, [items, filter]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" /> Notifications
          </h1>
          <p className="text-xs text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => void markAllRead()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'unread', 'read'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize border transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-semibold">{error}</div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400">Loading notifications…</div>
        ) : shown.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <BellOff className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No notifications</p>
            <p className="text-xs text-slate-400">You&apos;re all caught up!</p>
          </div>
        ) : (
          shown.map((n) => (
            <button
              key={n.id}
              onClick={() => void markRead(n.id)}
              className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                !n.read ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    !n.read ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                      {n.target_type === 'course' ? <BookOpen className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {n.target_type === 'course' ? 'Course' : 'Personal'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                    {n.body}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1.5">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
