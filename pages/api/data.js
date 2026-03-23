import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://hqfszlxdkvwlvpwqqmbd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZnN6bHhka3Z3bHZwd3FxbWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU1MTE4OCwiZXhwIjoyMDg4MTI3MTg4fQ.EAOsrTO51SrDiyRz5DHp0uGYSpUSans-uNlqZcABPyk'
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [itemsRes, projectRes, riskRes, usersRes] = await Promise.all([
      sb.from('cx_standup_items').select('*').order('sort_order', { ascending: true }),
      sb.from('cx_projects').select('*').order('created_at', { ascending: false }),
      sb.from('cx_risk_register').select('*').order('created_at', { ascending: false }),
      sb.from('cx_standup_users').select('*').order('display_name', { ascending: true }),
    ]);

    if (itemsRes.error || projectRes.error || riskRes.error || usersRes.error) {
      console.error('Supabase errors:', { itemsRes, projectRes, riskRes, usersRes });
      return res.status(500).json({
        error: 'Failed to fetch data',
        details: {
          items: itemsRes.error?.message,
          projects: projectRes.error?.message,
          risks: riskRes.error?.message,
          users: usersRes.error?.message,
        },
      });
    }

    return res.status(200).json({
      items: itemsRes.data || [],
      projects: projectRes.data || [],
      risks: riskRes.data || [],
      users: usersRes.data || [],
    });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
