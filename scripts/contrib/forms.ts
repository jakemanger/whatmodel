// The contribution issue forms. This file is the source of truth: the parser reads the field
// labels from here, and .github/ISSUE_TEMPLATE/<kind>.yml is generated from it.
//   node scripts/contrib/forms.ts           rewrite the YAML forms
//   node scripts/contrib/forms.ts --check   exit 1 if they're out of date (npm test checks this too)
// Field ids are stable: the website pre-fills them through URL parameters.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const KINDS = ["paper-results", "wrong-number", "update-model", "new-provider", "missing-model", "new-benchmark"] as const;
export type Kind = (typeof KINDS)[number];

export type Field = {
  id: string;
  type: "input" | "textarea" | "dropdown" | "checkboxes";
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  multiple?: boolean;
  options?: string[];
  requiredOptions?: boolean; // checkboxes: every box must be ticked
};
export type Form = { kind: Kind; name: string; description: string; labels: string[]; intro: string; fields: Field[] };

import { MODEL_FIELDS } from "../../lib/contribution-fields.ts";
export const REPO = "https://github.com/jakemanger/whatmodel";
export const CATEGORIES = ["Text (LLM)", "Image", "Video", "Text-to-speech", "Speech-to-text"];
export const BY = ["The source's authors, on models they didn't make", "The model's own makers", "Not sure"];
export const CONFIRM = "These are the source's own measurements";
const intro = `Fill in the fields below; no special text format is needed. A maintainer reviews the reference before updating the site. For several changes, you can also [edit the data and open a pull request](${REPO}/blob/main/CONTRIBUTING.md).`;
const input = (id: string, label: string, required = false, description?: string): Field => ({ id, label, type: "input", required, description });
const notes: Field = {id:"notes",label:"Notes (optional)",type:"textarea",description:"Table/page, evaluation settings, or anything needed to interpret the reference."};
const model = input("model","Model",true,"The model id from its page, for example qwen3-8b. Prefilled when opened from the site.");
const source = input("source","Reference URL",true,"The paper, model card or provider page that supports the proposed value.");
const changes = [model,
  input("what","Field to change",true,"Prefilled by the model page. Choose a field there, or use: "+Object.values(MODEL_FIELDS).join("; ")),
  input("before","Current value",false,"Prefilled by the model page. Leave blank if you do not know it."),
  input("after","Correct value",true,"Use the units shown in Field to change. Enter only the value."),
  source, notes];
export const FORMS: Form[] = [
  {kind:"update-model",name:"Update model information",description:"Correct one fact with a before/after value and reference.",labels:["data","update-model"],intro,fields:changes},
  {kind:"wrong-number",name:"Correct a benchmark score",description:"Correct a published test result we already list.",labels:["data","wrong-number"],intro,fields:[
    model,input("benchmark","Benchmark",true,"Exact benchmark id shown on the site."),
    input("before","Current score"),input("score","Correct score",true,"Include % for percentages, e.g. 71.2%. Otherwise use the source's numeric scale."),
    source,notes]},
  {kind:"paper-results",name:"Add a test result",description:"This model scored this value on this benchmark, according to this source.",labels:["data","paper-results"],intro,fields:[
    model,input("benchmark","Benchmark",true,"Use the benchmark id; the model page can prefill it."),
    input("score","Score",true,"Include % for percentages, e.g. 71.2%. Otherwise use the source's numeric scale."),source,
    {id:"by",label:"Who ran the evaluation? (optional)",type:"dropdown",options:BY},
    notes]},
  {kind:"missing-model",name:"Add a missing model",description:"Suggest a model by name and official reference.",labels:["data","missing-model"],intro,fields:[
    input("model","Model name",true),input("links","Official reference URL",true),
    {id:"category",label:"Category (optional)",type:"dropdown",options:CATEGORIES},
    input("maker","Maker (optional)"),
    {id:"weights",label:"Are the weights downloadable? (optional)",type:"dropdown",options:["Yes","No","Not sure"]},
    notes]},
  {kind:"new-provider",name:"Add a place to run a model",description:"Suggest an API, app or download with an official link.",labels:["data","new-provider"],intro,fields:[
    model,input("link","Official reference URL",true),
    input("provider","Provider or app (optional)"),
    {id:"kind",label:"Type (optional)",type:"dropdown",options:["API provider","Hosted service","Local runtime or download"]},
    input("command","Run command (optional)"),
    input("quant","Precision / quantization (optional)"),
    input("size","Memory or download size in GB (optional)"),
    {id:"platforms",label:"Documented platforms (optional)",type:"checkboxes",options:["Apple Silicon","NVIDIA","AMD","CPU only"]},
    notes]},
  {kind:"new-benchmark",name:"Suggest a benchmark or results source",description:"Point us to a test or a source of measurements.",labels:["data","new-benchmark"],intro,fields:[
    input("name","Benchmark or source name",true),input("link","Reference URL",true),
    {id:"proposal",label:"What is it? (optional)",type:"dropdown",options:["A new benchmark","Results for existing benchmarks"]},
    {id:"category",label:"Category (optional)",type:"dropdown",options:CATEGORIES},
    {id:"scale",label:"Score type (optional)",type:"dropdown",options:["Accuracy or percentage (higher is better)","Error rate (lower is better)","Elo or arena rating","Other"]},
    input("licence_link","Results licence URL (optional)"),notes]},
];

export const formFor = (kind: Kind) => FORMS.find((f) => f.kind === kind)!;

// YAML for one form. Scalars are written as JSON strings, which YAML reads the same way.
export function formYaml(f: Form): string {
  const q = (s: string) => JSON.stringify(s);
  const out = [`name: ${q(f.name)}`, `description: ${q(f.description)}`, `title: ${q(f.name)}`, `labels: [${f.labels.map(q).join(", ")}]`, "body:",
    "  - type: markdown", "    attributes:", "      value: |", ...f.intro.split("\n").map((l) => (l ? `        ${l}` : ""))];
  for (const x of f.fields) {
    out.push(`  - type: ${x.type}`, `    id: ${x.id}`, "    attributes:", `      label: ${q(x.label)}`);
    if (x.description) out.push(`      description: ${q(x.description)}`);
    if (x.placeholder) out.push(`      placeholder: ${q(x.placeholder)}`);
    if (x.multiple) out.push("      multiple: true");
    if (x.options && x.type === "checkboxes") {
      out.push("      options:", ...x.options.flatMap((o) => [`        - label: ${q(o)}`, ...(x.requiredOptions ? ["          required: true"] : [])]));
    } else if (x.options) out.push("      options:", ...x.options.map((o) => `        - ${q(o)}`));
    if (x.required) out.push("    validations:", "      required: true");
  }
  return out.join("\n") + "\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const stale: string[] = [];
  for (const f of FORMS) {
    const file = new URL(`../../.github/ISSUE_TEMPLATE/${f.kind}.yml`, import.meta.url);
    let current = "";
    try { current = readFileSync(file, "utf8"); } catch { /* new form */ }
    if (current === formYaml(f)) continue;
    stale.push(f.kind);
    if (!process.argv.includes("--check")) writeFileSync(file, formYaml(f));
  }
  if (process.argv.includes("--check") && stale.length) {
    console.error(`Out of date: ${stale.join(", ")}. Run: node scripts/contrib/forms.ts`);
    process.exit(1);
  }
  console.log(stale.length ? `${process.argv.includes("--check") ? "Stale" : "Wrote"}: ${stale.join(", ")}` : "Issue forms up to date.");
}
