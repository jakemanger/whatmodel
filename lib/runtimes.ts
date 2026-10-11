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
  | { kind: "other" };

export type RuntimeId = "llamacpp" | "lmstudio" | "ollama" | "mlx" | "other";
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
  return [{ runtime: "other", steps: [{ label: "as published", cmd: v.cmd }] }];
}

// The runtime a page shows first for a download: llama.cpp whenever it can load the file.
export const ORDER: RuntimeId[] = ["llamacpp", "lmstudio", "ollama", "mlx", "other"];
export function primary(v: Variant) {
  const all = stepsFor(v);
  const first = ORDER.map((id) => all.find((x) => x.runtime === id)).find(Boolean)!;
  return { runtime: RUNTIMES.find((r) => r.id === first.runtime)!, cmd: first.steps.find((s) => s.cmd)?.cmd ?? v.cmd };
}
