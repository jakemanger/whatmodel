import type { RowSpeed } from "./fit.ts";
import type { Model, Specs, Speed, Variant } from "./types.ts";

// Only speeds measured with the exact download on the visitor's own chip (reviewed /bench runs).
// Anything else stays blank: bandwidth predictions and cross-hardware scaling remain disabled.
type BenchSpeed = Speed & { hardware_id?: string; applicability?: { selected_download_eligible?: boolean; artifact_reference_as_reported?: string } };
export function measuredSpeed(speeds: Speed[], m: Model, v: Variant, s: Specs): RowSpeed | null {
  const tag = /^ollama run (\S+)$/.exec(v.cmd)?.[1];
  if (!tag || !s.hw) return null;
  const xs = (speeds as BenchSpeed[]).filter((x) => x.model === m.id && x.hardware_id === s.hw!.id && (x.offload ?? "none") === "none" &&
    x.applicability?.selected_download_eligible && x.applicability.artifact_reference_as_reported === `ollama ${tag}`);
  if (!xs.length) return null;
  const value = xs.map((x) => x.value).sort((a, b) => a - b)[(xs.length - 1) >> 1];
  return { value: value >= 10 ? Math.round(value) : Math.round(value * 10) / 10, unit: xs[0].unit, how: "measured", on: xs[0].hardware };
}
