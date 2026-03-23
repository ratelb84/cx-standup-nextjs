import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://hqfszlxdkvwlvpwqqmbd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZnN6bHhka3Z3bHZwd3FxbWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU1MTE4OCwiZXhwIjoyMDg4MTI3MTg4fQ.EAOsrTO51SrDiyRz5DHp0uGYSpUSans-uNlqZcABPyk'
);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get feedback for current user and week
      const { owner, week_start } = req.query;
      const query = sb.from('cx_standup_feedback').select('*');
      
      if (owner) query.eq('owner', owner);
      if (week_start) query.eq('week_start', week_start);
      
      const result = await query.order('created_at', { ascending: false });
      return res.status(200).json(result.data || []);
    }

    if (req.method === 'POST') {
      // Submit new feedback
      const { owner, week_start, performance, red_flags, project_updates, key_focus, escalations } = req.body;
      
      // Check if feedback already exists for this week
      const existing = await sb
        .from('cx_standup_feedback')
        .select('id')
        .eq('owner', owner)
        .eq('week_start', week_start);

      if (existing.data && existing.data.length > 0) {
        // Update existing
        const { error } = await sb
          .from('cx_standup_feedback')
          .update({
            performance,
            red_flags,
            project_updates,
            key_focus,
            escalations,
            status: 'Submitted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.data[0].id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await sb.from('cx_standup_feedback').insert({
          id: Date.now().toString(),
          owner,
          week_start,
          performance,
          red_flags,
          project_updates,
          key_focus,
          escalations,
          status: 'Submitted',
        });
        if (error) throw error;
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
