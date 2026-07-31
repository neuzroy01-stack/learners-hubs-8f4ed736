import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type CloudProfileRow = Database['public']['Tables']['profiles']['Row'];

/** Directory reads + Super Admin user management. RLS keeps this staff-only. */
export const profilesApi = {
  async list(role?: CloudProfileRow['role']) {
    let q = supabase.from('profiles').select('*').order('full_name');
    if (role) q = q.eq('role', role);
    q = q.is('deleted_at', null);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as CloudProfileRow[];
  },
  async get(id: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data as CloudProfileRow | null;
  },
  async update(id: string, patch: Database['public']['Tables']['profiles']['Update']) {
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as CloudProfileRow;
  },
  async setStatus(id: string, status: 'active' | 'inactive' | 'blocked') {
    return this.update(id, { status });
  },
  async setRole(id: string, role: CloudProfileRow['role']) {
    return this.update(id, { role });
  },
  async softDelete(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as CloudProfileRow;
  },
  async restore(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ deleted_at: null, status: 'active' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as CloudProfileRow;
  },
};
