import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export interface Job {
  id: string;
  name: string;
  client: string | null;
  status: string;
  quoted_amount: number | null;
  notes: string | null;
  created_at: string;
}

export const JOB_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On hold' },
] as const;

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error loading jobs', description: error.message, variant: 'destructive' });
    } else {
      setJobs((data as unknown as Job[]) || []);
    }
    setLoading(false);
  }, [toast]);

  const addJob = async (name: string, client: string, quotedAmount: number | null, notes: string) => {
    if (!name.trim()) return;
    const { error } = await supabase.from('jobs').insert({
      name: name.trim(),
      client: client || null,
      quoted_amount: quotedAmount,
      notes: notes || null,
      user_id: user!.id,
    });
    if (error) {
      toast({ title: 'Error creating job', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Job created' });
      await fetchJobs();
    }
  };

  const updateJob = async (id: string, patch: Partial<Pick<Job, 'name' | 'client' | 'status' | 'quoted_amount' | 'notes'>>) => {
    const { error } = await supabase.from('jobs').update(patch).eq('id', id);
    if (error) {
      toast({ title: 'Error updating job', description: error.message, variant: 'destructive' });
    } else {
      await fetchJobs();
    }
  };

  const deleteJob = async (id: string) => {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting job', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Job deleted' });
      await fetchJobs();
    }
  };

  return { jobs, loading, fetchJobs, addJob, updateJob, deleteJob };
}
