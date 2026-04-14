export default async function handler(req, res) {
  const { query } = req.query
  if (!query) return res.status(400).json({ error: 'Query required' })

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=6&dataType=SR%20Legacy,Foundation&api_key=${process.env.USDA_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    const foods = (data.foods || []).map(food => ({
      fdcId: String(food.fdcId),
      name: food.description,
      brand: food.brandOwner || '',
      per100g: {
        calories: Math.round(food.foodNutrients?.find(n => n.nutrientName === 'Energy')?.value || 0),
        protein: +(food.foodNutrients?.find(n => n.nutrientName === 'Protein')?.value || 0).toFixed(1),
        carbs: +(food.foodNutrients?.find(n => n.nutrientName === 'Carbohydrate, by difference')?.value || 0).toFixed(1),
        fat: +(food.foodNutrients?.find(n => n.nutrientName === 'Total lipid (fat)')?.value || 0).toFixed(1),
      }
    }))

    res.json({ foods })
  } catch (err) {
    res.status(500).json({ error: 'USDA search failed', detail: err.message })
  }
}
