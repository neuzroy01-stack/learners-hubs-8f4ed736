import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notificationsApi, type NotificationWithRead } from '../services/cloudDb';
import { useAuth } from '../context/AuthContext';

/**
 * Live notification feed for the signed-in user.
 * The database is the only source of truth — React state just mirrors the last fetch.
 */
export function useNotifications() {
  const { currentUser } = useAuth();
  const uid = currentUser?.id ?? '';
  const [items, setItems] = useState<NotificationWithRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const rows = await notificationsApi.listForStudent(uid);
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Realtime is only a delivery hint; every event re-reads from the database.
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`notifications-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        void reload();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [uid, reload]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markRead = useCallback(
    async (id: string) => {
      if (!uid) return;
      await notificationsApi.markRead(id, uid);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [uid],
  );

  const markAllRead = useCallback(async () => {
    if (!uid) return;
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    await notificationsApi.markAllRead(ids, uid);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [uid, items]);

  return { items, unreadCount, loading, error, reload, markRead, markAllRead };
}

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
};
