import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://hqfszlxdkvwlvpwqqmbd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZnN6bHhka3Z3bHZwd3FxbWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU1MTE4OCwiZXhwIjoyMDg4MTI3MTg4fQ.EAOsrTO51SrDiyRz5DHp0uGYSpUSans-uNlqZcABPyk'
);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all bills
      const result = await sb
        .from('municipal_bills')
        .select('*')
        .order('bill_date', { ascending: false });

      if (result.error && result.error.code === 'PGRST205') {
        // Table doesn't exist yet, return empty
        return res.status(200).json([]);
      }

      return res.status(200).json(result.data || []);
    }

    if (req.method === 'POST') {
      const { property, service_type, bill_date, amount, usage, unit, provider, reference } = req.body;

      const { error } = await sb.from('municipal_bills').insert({
        id: Date.now().toString(),
        property,
        service_type,
        bill_date,
        amount: parseFloat(amount),
        usage: usage ? parseFloat(usage) : null,
        unit,
        provider,
        reference,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      return res.status(201).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await sb.from('municipal_bills').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
