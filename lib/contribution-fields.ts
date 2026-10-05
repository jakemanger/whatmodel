import type { Model } from './types.ts';

// Shared by website links and issue forms; values carry their units.
export const MODEL_FIELDS = {
  name: 'Name', maker: 'Maker', released: 'Release date (YYYY-MM)', licence: 'Weights licence',
  params: 'Total parameters (B)', active: 'Active parameters (B)', context: 'Context window (k tokens)',
  open_weights: 'Downloadable weights (yes/no)', price_in: 'Input price (USD / 1M tokens)',
  price_out: 'Output price (USD / 1M tokens)', price: 'Price (USD / category unit)',
} as const;
export type ModelField = keyof typeof MODEL_FIELDS;
export function currentValue(m: Model, field: ModelField): string {
  const values = { name: m.name, maker: m.provider, released: m.released, licence: m.license,
    params: m.params_b, active: m.active_b, context: m.context_k,
    open_weights: m.open_weights ? 'yes' : 'no', price_in: m.api?.price_in, price_out: m.api?.price_out, price: m.api?.price };
  return String(values[field] ?? 'Not listed');
}
export function editableFields(m: Model): ModelField[] {
  return (Object.keys(MODEL_FIELDS) as ModelField[]).filter(k =>
    k === 'context' ? (m.category ?? 'llm') === 'llm' :
    k === 'price' ? !!m.api && (m.category ?? 'llm') !== 'llm' :
    k === 'price_in' || k === 'price_out' ? !!m.api && (m.category ?? 'llm') === 'llm' : true);
}
