export type Category = "llm" | "image" | "video" | "tts" | "stt";

export type Variant = {
  quant: string;
  gb: number; // LLMs: download size. Other categories: memory needed to run it
  gb_estimated?: boolean; // no source gave it: params × bytes per weight (see data.ts)
  cmd: string;
  platform?: "any" | "mac" | "nvidia";
  source?: string;
  split?: boolean; // a GGUF published in several files (Ollama can't load these)
};

export type Api = {
  url: string;
  provider?: string;
  price_source?: string;
  price_note?: string;
  price_in?: number; // LLMs: USD per 1M tokens
  price_out?: number;
  price?: number; // other categories: USD per `unit`
  unit?: "image" | "video-second" | "1M-chars" | "audio-minute";
  tps?: number; // LLMs: measured output tokens/sec
  tps_source?: string;
  speed?: number; // other categories: measured, in `speed_unit`
  speed_unit?: SpeedUnit;
  speed_source?: string;
};

export type Model = {
  id: string;
  name: string;
  provider: string;
  category?: Category; // default "llm"
  released?: string;
  released_source?: string;
  availability?: "preview"; // announced limited access; visible without claiming a public run route
  availability_source?: string;
  source?: string;
  model_repo?: string;
  identity_note?: string;
  open_weights: boolean;
  license?: string;
  license_source?: string;
  params_b?: number;
  params_b_source?: string;
  params_note?: string;
  active_b?: number;
  context_k?: number;
  context_source?: string;
  context_note?: string;
  api?: Api | null;
  local?: { variants: Variant[] } | null;
};

export type Result = {
  model: string;
  bench: string;
  score: number;
  source: string;
  by: "independent" | "lab";
  date?: string;
  note?: string;
  source_id?: string; // the data/sources.json entry the source URL falls under
  invalid?: string; // why this is a failed run, not a measurement of ability; shown, but kept out of scores
};

// kind "acc": score is a 0-1 fraction, `chance` is the guessing rate.
// kind "elo": score is an arena rating.
// kind "err": nonnegative error ratio (may exceed 1 with insertions), lower is better.
// Linear measurements (e.g. signed treatment effects) retain their raw units.
// latent_scale is a fixed unit conversion, never fitted to a desired ranking.
// Linear distances retain their published units with direction "lower".
export type Benchmark = { id: string; name: string; kind: "acc" | "elo" | "err" | "linear"; chance?: number; url: string; category?: Category; metric?: string; raw_scale_min?: number; raw_scale_max?: number; latent_scale?: number; direction?: "higher" | "lower"; unit?: string };

export type Scored = { id: string; g: number; pm: number; n: number; lab?: number }; // lab: counted results the model's own maker reported

export type SpeedUnit = "tok/s" | "s/image" | "s/video" | "x-realtime";

// A measured speed of one model on one machine.
export type Speed = {
  model: string;
  quant?: string;
  hardware: string;
  kind: "nvidia" | "amd" | "intel" | "apple" | "cpu";
  offload?: "none" | "layers" | "experts";
  value: number;
  unit: SpeedUnit;
  engine?: string;
  settings?: string;
  source: string;
  note?: string;
};

export type Hardware = {
  id: string;
  name: string;
  smi_name?: string;
  kind: "nvidia" | "amd" | "intel" | "apple" | "cpu";
  tier?: "base" | "pro" | "max" | "ultra";
  memory_gb: number[] | null; // CPU memory bandwidth entries do not specify a RAM capacity.
  bandwidth_gbs: number;
  released?: string;
  released_source?: string;
  source: string;
  unified?: boolean; // a non-Apple chip whose GPU shares system RAM
};

// gpu "card": a graphics card with its own memory (NVIDIA, AMD or Intel).
// gpu "unified": a non-Apple chip whose GPU shares system RAM (DGX Spark, Ryzen AI Max).
export type Specs = { ram: number; vram: number; gpu: "apple" | "card" | "unified" | "none"; hw?: Hardware | null };
