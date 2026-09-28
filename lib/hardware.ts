// Match what a user or a benchmark calls their hardware ("NVIDIA GeForce RTX 4090",
// "Apple M4 Pro", "m4-pro", "RTX 4090 24GB") to an entry in data/hardware.json.

import type { Hardware } from "./types.ts";

const norm = (s: string) =>
  s.toLowerCase().replace(/nvidia|geforce|apple|amd|radeon|intel|laptop gpu|\(.*?\)|\d+\s*gb/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

// memGb picks between cards sold under one name with different memory (4060 Ti 8GB / 16GB).
export function findHardware(list: Hardware[], text: string | null | undefined, memGb?: number): Hardware | null {
  if (!text) return null;
  const byId = list.find((h) => h.id === text);
  if (byId) return byId;
  const t = norm(text);
  if (!t) return null;
  // Exact normalized name first, then the longest name contained in the text ("rtx 4090" in "rtx 4090 d" loses to "rtx 4090 d").
  const byMem = (hs: Hardware[]) => (memGb && hs.find((h) => h.memory_gb.includes(memGb))) || hs[0] || null;
  const exact = list.filter((h) => norm(h.name) === t || (h.smi_name && norm(h.smi_name) === t));
  if (exact.length) return byMem(exact);
  const contained = list
    .filter((h) => ` ${t} `.includes(` ${norm(h.name)} `))
    .sort((a, b) => norm(b.name).length - norm(a.name).length);
  return byMem(contained.filter((h) => norm(h.name) === norm(contained[0]?.name ?? "")));
}
