import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select(`*, ingredients(*)`)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ recipes })
  }

  if (req.method === 'POST') {
    const { name, servings, notes, ingredients } = req.body

    // Calculate per-serving macros from ingredients
    const totals = ingredients.reduce((acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fat: acc.fat + (ing.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

    const perServing = {
      calories_per_serving: +(totals.calories / servings).toFixed(1),
      protein_per_serving: +(totals.protein / servings).toFixed(1),
      carbs_per_serving: +(totals.carbs / servings).toFixed(1),
      fat_per_serving: +(totals.fat / servings).toFixed(1),
    }

    // Insert recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({ name, servings, notes, ...perServing })
      .select()
      .single()

    if (recipeError) return res.status(500).json({ error: recipeError.message })

    // Insert ingredients
    const ingredientRows = ingredients.map(ing => ({
      recipe_id: recipe.id,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      calories: ing.calories,
      protein: ing.protein,
      carbs: ing.carbs,
      fat: ing.fat,
      usda_fdc_id: ing.fdcId || null,
    }))

    const { error: ingError } = await supabase.from('ingredients').insert(ingredientRows)
    if (ingError) return res.status(500).json({ error: ingError.message })

    return res.json({ recipe })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
