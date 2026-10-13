// How to run a download in each local runtime. A variant records one verified command; from it we
// read the file it points at (a GGUF repo and quant on Hugging Face, an MLX repo, or an Ollama
// library tag) and write the equivalent command for every runtime that can load that file.
// The templates were tested on 2026-10-11 with llama.cpp b11540, LM Studio 0.4, Ollama 0.30 and
// mlx-lm on macOS (docs/research/runtimes-2026-10-11.md).
import type { Variant } from "./types.ts";

export type Artifact =
  | { kind: "gguf"; repo: string; quant: string | null }
  | { kind: "mlx"; repo: string }
  | { kind: "ollama"; tag: string }
  | { kind: "strata"; family: string; model: string }
  | { kind: "other" };

export type RuntimeId = "llamacpp" | "lmstudio" | "ollama" | "mlx" | "strata" | "other";
export type Step = { label: string; cmd?: string; href?: string }; // a command to copy, a link to open, or just a sentence
export type Runtime = {
  id: RuntimeId; name: string; url: string;
  install: { label: string; cmd?: string; href?: string }[];
  note?: string;
};

export const RUNTIMES: Runtime[] = [
  {
    id: "llamacpp", name: "llama.cpp", url: "https://github.com/ggml-org/llama.cpp",
    install: [
      { label: "macOS / Linux", cmd: "curl -LsSf https://llama.app/install.sh | sh" },
      { label: "Windows", cmd: "irm https://llama.app/install.ps1 | iex" },
      { label: "other ways", href: "https://github.com/ggml-org/llama.cpp/blob/master/docs/install.md" },
    ],
    note: "Homebrew and winget installs name the commands llama-cli and llama-server instead.",
  },
  {
    id: "lmstudio", name: "LM Studio", url: "https://lmstudio.ai",
    install: [{ label: "macOS / Windows / Linux", href: "https://lmstudio.ai/download" }],
    note: "Open the app once before using the lms command.",
  },
  {
    id: "ollama", name: "Ollama", url: "https://ollama.com",
    install: [
      { label: "macOS / Windows", href: "https://ollama.com/download" },
      { label: "Linux", cmd: "curl -fsSL https://ollama.com/install.sh | sh" },
    ],
  },
  {
    id: "mlx", name: "MLX (Mac)", url: "https://github.com/ml-explore/mlx-lm",
    install: [{ label: "with uv", cmd: "uv tool install mlx-lm" }, { label: "or", cmd: "pip install mlx-lm" }],
    note: "Apple silicon Macs only, text only.",
  },
  {
    id: "strata", name: "Strata", url: "https://github.com/Niko1221/Strata",
    install: [{ label: "Windows / Linux", cmd: "git clone https://github.com/Niko1221/Strata.git && cd Strata" }],
    note: "Runs Qwen3.8-Flash-Next split across your graphics card, RAM and SSD: an NVIDIA or AMD card with 12 GB or more, Windows or Linux.",
  },
  { id: "other", name: "other", url: "", install: [] },
];

// GGUFs published in parts can't be loaded by Ollama. Hugging Face caps files at 50GB, so anything
// bigger is split even when the variant doesn't say so.
const SPLIT_GB = 45;

export function artifactOf(v: Variant): Artifact {
  const cmd = v.cmd.trim();
  const ollamaHf = cmd.match(/^ollama run hf\.co\/([\w.-]+\/[\w.-]+?)(?::([\w.-]+))?(?:\s|$)/);
  if (ollamaHf) return { kind: "gguf", repo: ollamaHf[1], quant: ollamaHf[2] ?? null };
  const tag = cmd.match(/^ollama run (\S+)/);
  if (tag) return { kind: "ollama", tag: tag[1] };
  const hf = cmd.match(/^llama-(?:server|cli)\b.*?\s-hf\s+([\w.-]+\/[\w.-]+?)(?::([\w.-]+))?(?:\s|$)/);
  if (hf) return { kind: "gguf", repo: hf[1], quant: hf[2] ?? null };
  const mlx = cmd.match(/mlx_lm[._](?:chat|generate|server)\b.*?--model\s+([\w.-]+\/[\w.-]+)/);
  if (mlx) return { kind: "mlx", repo: mlx[1] };
  const strata = /Niko1221\/Strata\b.*--family\s+(\w+)\s+--model\s+([\w.-]+)/.exec(cmd);
  if (strata) return { kind: "strata", family: strata[1], model: strata[2] };
  return { kind: "other" };
}

// Each runtime's steps for one download, in the order a person would type them.
export function stepsFor(v: Variant): { runtime: RuntimeId; steps: Step[] }[] {
  const a = artifactOf(v);
  const lms = (repo: string, quant?: string | null): Step[] => [
    { label: "open in LM Studio", href: `lmstudio://open_from_hf?model=${repo}` },
    { label: "or download it in the terminal", cmd: `lms get https://huggingface.co/${repo}${quant ? `@${quant}` : ""} -y` },
    { label: "then run lms ls to see its name, and lms chat followed by that name" },
  ];
  if (a.kind === "gguf") {
    const ref = a.quant ? `${a.repo}:${a.quant}` : a.repo;
    return [
      { runtime: "llamacpp", steps: [
        { label: "chat in the terminal", cmd: `llama cli -hf ${ref}` },
        { label: "or start a local server and open the address it prints (http://localhost:9931)", cmd: `llama serve -hf ${ref}` },
      ] },
      { runtime: "lmstudio", steps: lms(a.repo, a.quant) },
      ...(v.split || v.gb > SPLIT_GB ? [] : [{ runtime: "ollama" as const, steps: [{ label: "chat in the terminal", cmd: `ollama run hf.co/${ref}` }] }]),
    ];
  }
  if (a.kind === "mlx") return [
    { runtime: "mlx", steps: [
      { label: "chat in the terminal", cmd: `mlx_lm.chat --model ${a.repo}` },
      { label: "or start an OpenAI-compatible server at http://localhost:8080/v1", cmd: `mlx_lm.server --model ${a.repo}` },
    ] },
    { runtime: "lmstudio", steps: lms(a.repo) },
  ];
  if (a.kind === "ollama") return [{ runtime: "ollama", steps: [{ label: "chat in the terminal", cmd: v.cmd }] }];
  if (a.kind === "strata") {
    // setup writes run-<family tag><size>; the original model's family has no tag.
    const run = `run-${a.family === "qwen" ? "" : `${a.family}-`}${a.model.toLowerCase()}`;
    const setup = `--yes --family ${a.family} --model ${a.model} --no-start`;
    return [{ runtime: "strata", steps: [
      { label: "Linux: download and set up this size, then start it", cmd: `./setup.sh ${setup} && ./${run}.sh` },
      { label: "Windows (cmd): set up this size", cmd: `START-HERE.bat ${setup}` },
      { label: "then start it", cmd: `${run}.bat` },
      { label: "and open http://127.0.0.1:8080 (an OpenAI-compatible API at /v1)" },
    ] }];
  }
  return [{ runtime: "other", steps: [{ label: "as published", cmd: v.cmd }] }];
}

// The runtime a page shows first for a download: llama.cpp whenever it can load the file.
export const ORDER: RuntimeId[] = ["llamacpp", "lmstudio", "ollama", "mlx", "strata", "other"];
export function primary(v: Variant) {
  const all = stepsFor(v);
  const first = ORDER.map((id) => all.find((x) => x.runtime === id)).find(Boolean)!;
  return { runtime: RUNTIMES.find((r) => r.id === first.runtime)!, cmd: first.steps.find((s) => s.cmd)?.cmd ?? v.cmd };
}

// The "how to run it" guide both the site and the markdown pages show: one section per runtime that can
// load one of the downloads (llama.cpp first), each with its versions and the one to start on (4-bit).
// Ollama lists its own library tags when it has them, rather than the same GGUFs again via hf.co.
export type GuideSection = { runtime: Runtime; versions: { v: Variant; steps: Step[] }[]; preferred: number };
export function runGuide(variants: Variant[]): GuideSection[] {
  return RUNTIMES.flatMap((runtime) => {
    let versions = variants.flatMap((v) => stepsFor(v).filter((x) => x.runtime === runtime.id).map((x) => ({ v, steps: x.steps })));
    if (runtime.id === "ollama") {
      const tags = versions.filter((x) => !x.steps[0].cmd?.includes("hf.co/"));
      if (tags.length) versions = tags;
    }
    if (!versions.length) return [];
    return [{ runtime, versions, preferred: Math.max(0, versions.findIndex((x) => /q4|4.?bit/i.test(x.v.quant))) }];
  });
}

// A version's name as shown: quantisation codes in capitals, MLX bit widths as they are.
export const versionLabel = (v: Variant) => { const q = v.quant.replace(/^mlx-/, ""); return /^(i?q\d|bf16|f16|f32)/i.test(q) ? q.toUpperCase() : q; };

// What a download needs: its size, or for a split download (Strata) the GPU memory and RAM it runs
// well with, and the machines it runs on.
const ONLY = { mac: "Mac", nvidia: "NVIDIA", gpu: "NVIDIA or AMD card" } as const;
export const needsLabel = (v: Variant) => {
  const n = v.needs?.find((x) => !x.slow);
  const size = n ? `${n.vram_gb} GB VRAM + ${n.ram_gb} GB RAM, ${v.gb} GB download` : `${v.gb_estimated ? "~" : ""}${v.gb} GB`;
  return `${size}${v.platform && v.platform !== "any" ? `, ${ONLY[v.platform]} only` : ""}`;
};
