import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type CloudProfileRow = Database['public']['Tables']['profiles']['Row'];

/** Directory reads for staff screens. RLS keeps this staff-only. */
export const profilesApi = {
  async list(role?: CloudProfileRow['role']) {
    let q = supabase.from('profiles').select('*').order('full_name');
    if (role) q = q.eq('role', role);
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
};
