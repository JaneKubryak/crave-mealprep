import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const C = {
  cal: '#f97316', protein: '#3b82f6', carbs: '#eab308', fat: '#a855f7',
  card: '#0f1623', border: '#1a2235', muted: '#3d5068', sub: '#6b7f99',
  text: '#e8edf5', bg: '#080b12',
}

function IngredientSearch({ onAdd }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [qty, setQty] = useState('')
  const debounce = useRef(null)

  function search(q) {
    setQuery(q)
    if (debounce.current) clearTimeout(debounce.current)
    if (!q.trim()) { setResults([]); return }
    debounce.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/search-ingredient?query=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.foods || [])
      setLoading(false)
    }, 400)
  }

  function selectFood(food) {
    setSelected(food)
    setResults([])
    setQuery(food.name)
  }

  function add() {
    if (!selected || !qty) return
    const grams = parseFloat(qty)
    const factor = grams / 100
    onAdd({
      name: selected.name,
      fdcId: selected.fdcId,
      quantity: grams,
      unit: 'g',
      calories: +(selected.per100g.calories * factor).toFixed(1),
      protein: +(selected.per100g.protein * factor).toFixed(1),
      carbs: +(selected.per100g.carbs * factor).toFixed(1),
      fat: +(selected.per100g.fat * factor).toFixed(1),
    })
    setQuery('')
    setSelected(null)
    setQty('')
    setResults([])
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={query}
            onChange={e => { search(e.target.value); setSelected(null) }}
            placeholder="Search ingredient (e.g. oats, eggs...)"
            style={{ width: '100%', background: '#080b12', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 14 }}
          />
          {(results.length > 0 || loading) && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 20, maxHeight: 220, overflowY: 'auto', marginTop: 4 }}>
              {loading && <div style={{ padding: 12, color: C.muted, fontSize: 13 }}>Searching USDA...</div>}
              {results.map(food => (
                <div key={food.fdcId} onClick={() => selectFood(food)}
                  style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: C.text }}>{food.name}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>
                    {food.per100g.calories} kcal · {food.per100g.carbs}g C · {food.per100g.protein}g P · {food.per100g.fat}g F per 100g
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <input
          type="number"
          value={qty}
          onChange={e => setQty(e.target.value)}
          placeholder="g"
          style={{ width: 70, background: '#080b12', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 10px', color: C.text, fontSize: 14, textAlign: 'center' }}
        />
        <button onClick={add} disabled={!selected || !qty}
          style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: selected && qty ? '#1e3a5f' : C.border, color: selected && qty ? '#93c5fd' : C.muted, fontWeight: 700, fontSize: 14 }}>
          Add
        </button>
      </div>
    </div>
  )
}

function CreateRecipeModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [servings, setServings] = useState(4)
  const [notes, setNotes] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [saving, setSaving] = useState(false)

  const totals = ingredients.reduce((a, i) => ({
    calories: a.calories + i.calories,
    protein: a.protein + i.protein,
    carbs: a.carbs + i.carbs,
    fat: a.fat + i.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const perServing = {
    calories: +(totals.calories / servings).toFixed(0),
    protein: +(totals.protein / servings).toFixed(1),
    carbs: +(totals.carbs / servings).toFixed(1),
    fat: +(totals.fat / servings).toFixed(1),
  }

  async function save() {
    if (!name || ingredients.length === 0) return
    setSaving(true)
    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, servings, notes, ingredients }),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000cc', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: C.card, borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '20px 16px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>New Recipe</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 22 }}>×</button>
        </div>

        {/* Recipe name */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 5, letterSpacing: 1 }}>RECIPE NAME</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Oatmeal Pancakes"
            style={{ width: '100%', background: '#080b12', border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 15, fontWeight: 600 }} />
        </div>

        {/* Servings */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 5, letterSpacing: 1 }}>TOTAL SERVINGS THIS BATCH MAKES</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setServings(Math.max(1, servings - 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: C.border, border: 'none', color: C.text, fontSize: 18, fontWeight: 700 }}>−</button>
            <span style={{ fontSize: 22, fontWeight: 800, minWidth: 30, textAlign: 'center' }}>{servings}</span>
            <button onClick={() => setServings(servings + 1)} style={{ width: 36, height: 36, borderRadius: '50%', background: C.border, border: 'none', color: C.text, fontSize: 18, fontWeight: 700 }}>+</button>
          </div>
        </div>

        {/* Ingredient search */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 8, letterSpacing: 1 }}>INGREDIENTS (search + enter grams)</div>
          <IngredientSearch onAdd={ing => setIngredients(prev => [...prev, ing])} />
        </div>

        {/* Ingredient list */}
        {ingredients.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#080b12', borderRadius: 8, marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ing.name}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{ing.quantity}g · {ing.carbs}g C · {ing.protein}g P · {ing.calories} kcal</div>
                </div>
                <button onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18 }}>×</button>
              </div>
            ))}

            {/* Per-serving summary */}
            <div style={{ marginTop: 12, background: '#0a1628', border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 8, letterSpacing: 1 }}>PER SERVING ({servings} servings)</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.cal }}>{perServing.calories}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>kcal</div>
                </div>
                {[['carbs', C.carbs], ['protein', C.protein], ['fat', C.fat]].map(([k, c]) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{perServing[k]}g</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 5, letterSpacing: 1 }}>NOTES (optional)</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. batch cooked Sunday, keeps 4 days in fridge"
            style={{ width: '100%', background: '#080b12', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, resize: 'none', height: 70 }} />
        </div>

        <button onClick={save} disabled={!name || ingredients.length === 0 || saving}
          style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: name && ingredients.length > 0 ? '#166534' : C.border, color: name && ingredients.length > 0 ? '#86efac' : C.muted, fontSize: 15, fontWeight: 800 }}>
          {saving ? 'Saving...' : 'Save Recipe'}
        </button>
      </div>
    </div>
  )
}

export default function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState(null)

  async function load() {
    const res = await fetch('/api/recipes')
    const data = await res.json()
    setRecipes(data.recipes || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteRecipe(id) {
    if (!confirm('Delete this recipe?')) return
    await fetch(`/api/recipes?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', padding: '20px 14px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Link href="/" style={{ fontSize: 11, color: C.muted, textDecoration: 'none', letterSpacing: 1 }}>← TODAY</Link>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginTop: 2 }}>Recipes</div>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ background: '#166534', border: 'none', color: '#86efac', padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          + New
        </button>
      </div>

      {loading ? (
        <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : recipes.length === 0 ? (
        <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.sub }}>No recipes yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Tap "+ New" to add your first recipe</div>
        </div>
      ) : (
        recipes.map(recipe => (
          <div key={recipe.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, marginBottom: 10, overflow: 'hidden' }}>
            <div onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{recipe.name}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{recipe.servings} servings · {recipe.ingredients?.length || 0} ingredients</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: C.cal }}>{recipe.calories_per_serving} kcal</div>
                <div style={{ fontSize: 11, color: C.sub }}>per serving</div>
              </div>
            </div>

            {expanded === recipe.id && (
              <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, marginBottom: 12 }}>
                  {[['carbs', C.carbs], ['protein', C.protein], ['fat', C.fat]].map(([k, c]) => (
                    <div key={k} style={{ padding: '4px 12px', borderRadius: 20, background: c + '15', border: `1px solid ${c}30`, fontSize: 12, color: c, fontWeight: 700 }}>
                      {recipe[k + '_per_serving']}g {k}
                    </div>
                  ))}
                </div>

                {recipe.ingredients?.map((ing, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>{ing.name}</span>
                    <span style={{ color: C.sub, fontFamily: 'monospace' }}>{ing.quantity}{ing.unit} · {ing.carbs}g C · {ing.calories}cal</span>
                  </div>
                ))}

                {recipe.notes && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: '#080b12', borderRadius: 8, fontSize: 12, color: C.sub, fontStyle: 'italic' }}>
                    {recipe.notes}
                  </div>
                )}

                <button onClick={() => deleteRecipe(recipe.id)}
                  style={{ marginTop: 12, background: 'transparent', border: `1px solid #ef444430`, borderRadius: 8, padding: '6px 14px', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
                  Delete recipe
                </button>
              </div>
            )}
          </div>
        ))
      )}

      <button onClick={() => setShowCreate(true)} style={{
        position: 'fixed', bottom: 28, right: 20, width: 60, height: 60, borderRadius: '50%',
        background: '#166534', border: 'none', color: '#86efac', fontSize: 28, fontWeight: 300,
        boxShadow: '0 4px 20px #166534aa', zIndex: 40
      }}>+</button>

      {showCreate && <CreateRecipeModal onClose={() => setShowCreate(false)} onSaved={load} />}
    </div>
  )
}
