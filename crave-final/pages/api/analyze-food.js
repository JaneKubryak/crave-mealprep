import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { image, mediaType, text } = req.body

  if (!image && !text) {
    return res.status(400).json({ error: 'Provide an image or text description' })
  }

  const systemPrompt = `You are a nutrition expert. Analyze food and estimate macros accurately.
Always respond with ONLY a valid JSON object in this exact format:
{
  "meal_name": "descriptive name of the food",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "notes": "brief note about portion assumptions or confidence"
}`

  const userContent = []

  if (image) {
    userContent.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image },
    })
  }

  userContent.push({
    type: 'text',
    text: text
      ? `Analyze this food and estimate its macros. Additional context: ${text}`
      : 'Analyze this food and estimate its macros. Give your best estimate for a typical serving shown.',
  })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = message.content[0].text.trim()
    // Strip markdown code fences if present
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const result = JSON.parse(jsonText)

    return res.json({
      meal_name: result.meal_name || 'Analyzed meal',
      calories: Math.round(Number(result.calories) || 0),
      protein: Math.round((Number(result.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(result.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(result.fat) || 0) * 10) / 10,
      notes: result.notes || '',
    })
  } catch (err) {
    console.error('analyze-food error:', err)
    return res.status(500).json({ error: 'Failed to analyze food. Try adding a text description.' })
  }
}
