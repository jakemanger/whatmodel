import type { RowSpeed } from "./fit.ts";
import type { Hardware, Model, Specs, Speed, SpeedUnit, Variant } from "./types.ts";

// The measured speed a board row shows. Every model with a measurement shows one, saying where it
// was measured: on the visitor's own chip if we have it, else the closest comparable machine, else a
// typical run. No speed is estimated. `basis` says what it can decide: a run on the visitor's chip
// decides whether the model is slow on it; a comparable run (the same placement, on a machine with
// no more GPU memory and, when we know the visitor's chip, no more bandwidth) can only show a model
// the memory rule calls slow runs at a usable speed.
export type BenchSpeed = Speed & { hardware_id?: string; context_tokens?: number; applicability?: { selected_download_eligible?: boolean; artifact_reference_as_reported?: string } };
export type Measured = { speed: RowSpeed; basis: "exact" | "comparable" | "other" };

// Where the weights ran: all in GPU or unified memory, layers in system RAM, or experts in RAM by design.
const placement = (x: { offload?: string }) => x.offload ?? "none";
const classOf = (h: Hardware) => (h.kind === "apple" ? "apple" : h.unified ? "unified" : h.kind === "cpu" ? "cpu" : "card");
const round = (v: number) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);

export function measuredFor(speeds: Speed[], hardware: Hardware[], m: Model, v: Variant | null, s: Specs | null, offloaded: boolean | null): Measured | null {
  let runs = (speeds as BenchSpeed[]).filter((x) => x.model === m.id && x.value > 0);
  if (!runs.length) return null;
  // One unit per model: the one most of its runs use.
  const units = new Map<SpeedUnit, number>();
  for (const x of runs) units.set(x.unit, (units.get(x.unit) ?? 0) + 1);
  const unit = [...units].sort((a, b) => b[1] - a[1])[0][0];
  runs = runs.filter((x) => x.unit === unit);

  const want = v?.offload ?? (offloaded ? "layers" : "none");
  const same = runs.filter((x) => placement(x) === want);
  // Several runs: their median, and the machines they ran on.
  const pick = (xs: BenchSpeed[], basis: Measured["basis"]): Measured => {
    const v = xs.map((x) => x.value).sort((a, b) => a - b), mid = v.length >> 1;
    const median = v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
    const machines = [...new Set(xs.map((x) => x.hardware))];
    const on = `${machines.slice(0, 3).join("; ")}${machines.length > 3 ? ` and ${machines.length - 3} more` : ""}${xs.length > 1 ? ` (median of ${xs.length} runs)` : ""}`;
    return { basis, speed: { value: round(median), unit, how: basis === "exact" ? "measured" : "elsewhere", on } };
  };

  if (s?.hw) {
    const mine = same.filter((x) => x.hardware_id === s.hw!.id);
    if (mine.length) return pick(mine, "exact");
  }
  const byId = new Map(hardware.map((h) => [h.id, h]));
  const cls = !s ? null : s.gpu === "apple" ? "apple" : s.gpu === "unified" ? "unified" : s.gpu === "card" ? "card" : "cpu";
  const memory = !s ? 0 : cls === "card" ? s.vram : s.ram;
  if (s && cls !== "cpu") {
    const comparable = same.flatMap((x) => {
      const h = x.hardware_id ? byId.get(x.hardware_id) : undefined;
      if (!h || classOf(h) !== cls || !h.memory_gb?.length) return [];
      if (Math.max(...h.memory_gb) > memory + 1) return [];
      if (s.hw && h.bandwidth_gbs > s.hw.bandwidth_gbs * 1.1) return [];
      return [{ x, gb: Math.max(...h.memory_gb) }];
    });
    if (comparable.length) {
      const top = Math.max(...comparable.map((c) => c.gb)); // the machines closest to the visitor's
      return pick(comparable.filter((c) => c.gb === top).map((c) => c.x), "comparable");
    }
  }
  // Otherwise a typical run: the same placement if there is one, from the kind of machine closest to
  // the visitor's (the same class of chip, then the nearest memory size).
  let rest = same.length ? same : runs.some((x) => placement(x) === "none") ? runs.filter((x) => placement(x) === "none") : runs;
  if (s) {
    const distance = (x: BenchSpeed) => {
      const h = x.hardware_id ? byId.get(x.hardware_id) : undefined;
      if (!h) return 1e6;
      const gb = h.memory_gb?.length ? Math.max(...h.memory_gb) : memory;
      return (classOf(h) === cls ? 0 : 1000) + Math.abs(Math.log2(Math.max(gb, 1) / Math.max(memory, 1)));
    };
    const best = Math.min(...rest.map(distance));
    rest = rest.filter((x) => distance(x) === best);
  }
  return pick(rest, "other");
}
