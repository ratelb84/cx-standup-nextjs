import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://hqfszlxdkvwlvpwqqmbd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZnN6bHhka3Z3bHZwd3FxbWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU1MTE4OCwiZXhwIjoyMDg4MTI3MTg4fQ.EAOsrTO51SrDiyRz5DHp0uGYSpUSans-uNlqZcABPyk'
);

export default async function handler(req, res) {
  try {
    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await sb.from('cx_standup_items').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { status, ...data } = req.body;
      
      const updateData = status ? { status, ...data } : data;
      const { error } = await sb.from('cx_standup_items').update(updateData).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'POST') {
      const { item, action, priority, status, due_date, owners, owner } = req.body;
      const { error } = await sb.from('cx_standup_items').insert({
        id: Date.now().toString(),
        item,
        action,
        priority: priority || 'High',
        status: status || 'Open',
        due_date,
        owners: owners || [owner],
        owner: owner || owners?.[0],
        sort_order: 0,
        comments: [],
      });
      if (error) throw error;
      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
