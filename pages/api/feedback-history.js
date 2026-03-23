import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://hqfszlxdkvwlvpwqqmbd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZnN6bHhka3Z3bHZwd3FxbWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU1MTE4OCwiZXhwIjoyMDg4MTI3MTg4fQ.EAOsrTO51SrDiyRz5DHp0uGYSpUSans-uNlqZcABPyk'
);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all feedback across all weeks, sorted by week
      const result = await sb
        .from('cx_standup_feedback')
        .select('*')
        .order('week_start', { ascending: false });

      return res.status(200).json(result.data || []);
    }

    if (req.method === 'PATCH') {
      // Update feedback with outcomes/notes
      const { id, outcomes, reasons } = req.body;
      
      const { error } = await sb
        .from('cx_standup_feedback')
        .update({
          outcomes,
          reasons,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
