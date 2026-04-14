import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { date } = req.query
    const targetDate = date || new Date().toISOString().split('T')[0]

    const { data: entries, error } = await supabase
      .from('food_log')
      .select('*')
      .eq('logged_at', targetDate)
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ entries })
  }

  if (req.method === 'POST') {
    const { meal_name, servings, recipe_id, calories, protein, carbs, fat, source, notes } = req.body

    const { data: entry, error } = await supabase
      .from('food_log')
      .insert({
        meal_name,
        servings: servings || 1,
        recipe_id: recipe_id || null,
        calories: +calories.toFixed(1),
        protein: +protein.toFixed(1),
        carbs: +carbs.toFixed(1),
        fat: +fat.toFixed(1),
        source: source || 'manual',
        notes: notes || null,
        logged_at: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ entry })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabase.from('food_log').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
