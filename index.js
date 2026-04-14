import { useState, useEffect } from 'react'
import Link from 'next/link'

const GOALS = { calories: 1600, protein: 114, carbs: 120, fat: 55 }
const C = {
  cal: '#f97316', protein: '#3b82f6', carbs: '#eab308', fat: '#a855f7',
  card: '#0f1623', border: '#1a2235', muted: '#3d5068', sub: '#6b7f99',
  text: '#e8edf5', bg: '#080b12',
}

function MacroRing({ value, max, color, label, size = 80 }) {
  const eaten = max - Math.max(value, 0)
  const pct = Math.min(eaten / max, 1)
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={7} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
            strokeWidth={7} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: label === 'kcal' ? 12 : 14, fontWeight: 800, color, lineHeight: 1 }}>{Math.max(value, 0)}</span>
          <span style={{ fontSize: 9, color: C.muted }}>{label}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color: C.sub, letterSpacing: 1 }}>
        {label === 'kcal' ? 'CAL LEFT' : label.toUpperCase() + ' LEFT'}
      </span>
    </div>
  )
}

function LogMealModal({ recipes, onClose, onLogged }) {
  const [mode, setMode] = useState('recipe') // recipe | quick
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [servings, setServings] = useState(1)
  const [quickName, setQuickName] = useState('')
  const [quickMacros, setQuickMacros] = useState({ calories: '', protein: '', carbs: '', fat: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  async function logMeal() {
    setSaving(true)
    let payload
    if (mode === 'recipe' && selectedRecipe) {
      payload = {
        meal_name: `${selectedRecipe.name} (${servings} serving${servings > 1 ? 's' : ''})`,
        servings,
        recipe_id: selectedRecipe.id,
        calories: selectedRecipe.calories_per_serving * servings,
        protein: selectedRecipe.protein_per_serving * servings,
        carbs: selectedRecipe.carbs_per_serving * servings,
        fat: selectedRecipe.fat_per_serving * servings,
        source: 'recipe',
      }
    } else {
      payload = {
        meal_name: quickName,
        servings: 1,
        calories: +quickMacros.calories || 0,
        protein: +quickMacros.protein || 0,
        carbs: +quickMacros.carbs || 0,
        fat: +quickMacros.fat || 0,
        source: 'manual',
      }
    }

    await fetch('/api/food-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    onLogged()
    onClose()
  }

  const canLog = mode === 'recipe' ? !!selectedRecipe : (quickName && quickMacros.calories)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000cc', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: C.card, borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '20px 16px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Log a Meal</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 22 }}>×</button>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, background: '#080b12', borderRadius: 10, padding: 4, marginBottom: 16 }}>
          {[['recipe', '📖 From Recipe'], ['quick', '✏️ Quick Entry']].map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              background: mode === id ? C.border : 'transparent',
              color: mode === id ? C.text : C.muted, fontSize: 13, fontWeight: mode === id ? 700 : 400
            }}>{label}</button>
          ))}
        </div>

        {mode === 'recipe' && (
          <div>
            <input
              placeholder="Search your recipes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: '#080b12', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 14, marginBottom: 12 }}
            />
            {filtered.length === 0 && (
              <div style={{ color: C.muted, textAlign: 'center', padding: 20 }}>
                No recipes yet. <Link href="/recipes" style={{ color: '#3b82f6' }}>Create one →</Link>
              </div>
            )}
            {filtered.map(r => (
              <div key={r.id} onClick={() => setSelectedRecipe(selectedRecipe?.id === r.id ? null : r)}
                style={{ background: selectedRecipe?.id === r.id ? '#1a2d4a' : '#080b12', border: `1px solid ${selectedRecipe?.id === r.id ? '#3b82f6' : C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: C.sub }}>{r.servings} servings total</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.cal }}>{r.calories_per_serving} kcal</div>
                    <div style={{ fontSize: 11, color: C.sub }}>per serving · {r.carbs_per_serving}g C · {r.protein_per_serving}g P</div>
                  </div>
                </div>
              </div>
            ))}
            {selectedRecipe && (
              <div style={{ marginTop: 12, background: '#080b12', borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 8 }}>How many servings?</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setServings(Math.max(0.5, servings - 0.5))} style={{ width: 36, height: 36, borderRadius: '50%', background: C.border, border: 'none', color: C.text, fontSize: 18, fontWeight: 700 }}>−</button>
                  <span style={{ fontSize: 20, fontWeight: 800, minWidth: 40, textAlign: 'center' }}>{servings}</span>
                  <button onClick={() => setServings(servings + 0.5)} style={{ width: 36, height: 36, borderRadius: '50%', background: C.border, border: 'none', color: C.text, fontSize: 18, fontWeight: 700 }}>+</button>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.cal }}>{Math.round(selectedRecipe.calories_per_serving * servings)} kcal</div>
                    <div style={{ fontSize: 11, color: C.sub }}>{(selectedRecipe.carbs_per_serving * servings).toFixed(1)}g C · {(selectedRecipe.protein_per_serving * servings).toFixed(1)}g P</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'quick' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Meal name (e.g. Braised beef salad)" value={quickName} onChange={e => setQuickName(e.target.value)}
              style={{ background: '#080b12', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 14 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['calories', 'Calories (kcal)', C.cal], ['protein', 'Protein (g)', C.protein], ['carbs', 'Carbs (g)', C.carbs], ['fat', 'Fat (g)', C.fat]].map(([k, label, color]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color, marginBottom: 4, fontWeight: 600 }}>{label}</div>
                  <input type="number" value={quickMacros[k]} onChange={e => setQuickMacros(p => ({ ...p, [k]: e.target.value }))}
                    style={{ width: '100%', background: '#080b12', border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', color: C.text, fontSize: 15, fontWeight: 700 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={logMeal} disabled={!canLog || saving}
          style={{ width: '100%', marginTop: 20, padding: '14px 0', borderRadius: 12, border: 'none', background: canLog ? '#166534' : C.border, color: canLog ? '#86efac' : C.muted, fontSize: 15, fontWeight: 800 }}>
          {saving ? 'Logging...' : 'Log Meal'}
        </button>
      </div>
    </div>
  )
}

export default function Today() {
  const [entries, setEntries] = useState([])
  const [recipes, setRecipes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })

  async function load() {
    const [logRes, recipeRes] = await Promise.all([
      fetch('/api/food-log'),
      fetch('/api/recipes'),
    ])
    const logData = await logRes.json()
    const recipeData = await recipeRes.json()
    setEntries(logData.entries || [])
    setRecipes(recipeData.recipes || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteEntry(id) {
    await fetch(`/api/food-log?id=${id}`, { method: 'DELETE' })
    load()
  }

  const totals = entries.reduce((a, e) => ({
    calories: a.calories + (e.calories || 0),
    protein: a.protein + (e.protein || 0),
    carbs: a.carbs + (e.carbs || 0),
    fat: a.fat + (e.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const left = {
    calories: GOALS.calories - totals.calories,
    protein: GOALS.protein - totals.protein,
    carbs: GOALS.carbs - totals.carbs,
    fat: GOALS.fat - totals.fat,
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', padding: '20px 14px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 3, fontFamily: 'monospace' }}>CRAVE</div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{today}</div>
        </div>
        <Link href="/recipes" style={{ textDecoration: 'none', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', fontSize: 13, color: C.sub, fontWeight: 600 }}>
          📖 Recipes
        </Link>
      </div>

      {/* Macro rings */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
          <MacroRing value={left.calories} max={GOALS.calories} color={C.cal} label="kcal" />
          <MacroRing value={left.protein} max={GOALS.protein} color={C.protein} label="protein" />
          <MacroRing value={left.carbs} max={GOALS.carbs} color={C.carbs} label="carbs" />
          <MacroRing value={left.fat} max={GOALS.fat} color={C.fat} label="fat" />
        </div>

        {/* Eaten totals */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 4px 0', borderTop: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.cal }}>{Math.round(totals.calories)}</div>
            <div style={{ fontSize: 9, color: C.muted }}>eaten kcal</div>
          </div>
          {[['protein', C.protein], ['carbs', C.carbs], ['fat', C.fat]].map(([k, c]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: c }}>{totals[k].toFixed(0)}g</div>
              <div style={{ fontSize: 9, color: C.muted }}>of {GOALS[k]}g</div>
            </div>
          ))}
        </div>

        {/* Status pills */}
        {entries.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {[
              { ok: totals.protein >= GOALS.protein * 0.85, yes: '✓ Protein good', no: `Need +${Math.round(GOALS.protein - totals.protein)}g protein` },
              { ok: totals.calories <= GOALS.calories, yes: '✓ In deficit', no: `${Math.round(totals.calories - GOALS.calories)} kcal over` },
              { ok: totals.carbs <= GOALS.carbs, yes: '✓ Carbs controlled', no: `${Math.round(totals.carbs - GOALS.carbs)}g carbs over` },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: s.ok ? '#14532d20' : '#7f1d1d20',
                border: `1px solid ${s.ok ? '#22c55e35' : '#ef444435'}`,
                color: s.ok ? '#86efac' : '#fca5a5',
              }}>{s.ok ? s.yes : s.no}</div>
            ))}
          </div>
        )}
      </div>

      {/* Meal list */}
      {loading ? (
        <div style={{ color: C.muted, textAlign: 'center', padding: 30 }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div style={{ color: C.muted, textAlign: 'center', padding: 30, fontSize: 14 }}>
          Nothing logged yet today.<br />
          <span style={{ fontSize: 12 }}>Tap + to log your first meal.</span>
        </div>
      ) : (
        entries.map(entry => (
          <div key={entry.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.meal_name}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                {entry.carbs}g C · {entry.protein}g P · {entry.fat}g F
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.cal }}>{Math.round(entry.calories)}</div>
                <div style={{ fontSize: 9, color: C.muted }}>kcal</div>
              </div>
              <button onClick={() => deleteEntry(entry.id)} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, padding: '0 4px' }}>×</button>
            </div>
          </div>
        ))
      )}

      {/* FAB */}
      <button onClick={() => setShowModal(true)} style={{
        position: 'fixed', bottom: 28, right: 20, width: 60, height: 60, borderRadius: '50%',
        background: '#166534', border: 'none', color: '#86efac', fontSize: 28, fontWeight: 300,
        boxShadow: '0 4px 20px #166534aa', zIndex: 40
      }}>+</button>

      {showModal && <LogMealModal recipes={recipes} onClose={() => setShowModal(false)} onLogged={load} />}
    </div>
  )
}
