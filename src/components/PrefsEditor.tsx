"use client";

import type { DietTag, Occasion, Preferences } from "@/lib/types";

const DIETS: Array<{ id: DietTag; label: string }> = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "gluten-free", label: "Gluten-free" },
  { id: "dairy-free", label: "Dairy-free" },
  { id: "nut-free", label: "Nut-free" },
];
const MOODS: Array<{ id: Occasion; label: string }> = [
  { id: "work", label: "Here to work" },
  { id: "meeting", label: "Meeting someone" },
  { id: "unwind", label: "Unwinding" },
];

export function PrefsEditor({ value, onChange, compact = false }: { value: Preferences; onChange: (p: Preferences) => void; compact?: boolean }) {
  const toggleDiet = (d: DietTag) =>
    onChange({ ...value, dietary: value.dietary.includes(d) ? value.dietary.filter((x) => x !== d) : [...value.dietary, d] });

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-mocha mb-2">Dietary</legend>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <button key={d.id} type="button" className="chip" aria-pressed={value.dietary.includes(d.id)} onClick={() => toggleDiet(d.id)}>
              {d.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-mocha mb-2">Caffeine</legend>
        <div className="flex flex-wrap gap-2">
          {(["any", "low", "none"] as const).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={(value.caffeine ?? "any") === c} onClick={() => onChange({ ...value, caffeine: c })}>
              {c === "any" ? "Bring it on" : c === "low" ? "Go easy" : "None"}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-mocha mb-2">Today I am</legend>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m.id} type="button" className="chip" aria-pressed={value.mood === m.id} onClick={() => onChange({ ...value, mood: value.mood === m.id ? undefined : m.id })}>
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wide text-mocha mb-1">Favourites</span>
            <input
              className="w-full rounded-xl border border-espresso/15 bg-white px-3 py-2"
              placeholder="e.g. oat latte, croissant"
              value={value.favourites.join(", ")}
              onChange={(e) => onChange({ ...value, favourites: e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10) })}
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wide text-mocha mb-1">Not today</span>
            <input
              className="w-full rounded-xl border border-espresso/15 bg-white px-3 py-2"
              placeholder="e.g. matcha, soup"
              value={value.dislikes.join(", ")}
              onChange={(e) => onChange({ ...value, dislikes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10) })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
