// Explicitly reviewed benchmark membership, never inferred from a model's name.
// New benchmarks must be assigned deliberately; missing evidence is not a claim
// that a model is incapable of a task.
import definitions from "../data/tasks.json" with { type: "json" };
import type { Category } from "./types.ts";

export type TaskDefinition = {
  id: string; category: Category; label: string; title: string;
  description: string; benchmarks: string[];
};
export const TASKS = definitions as TaskDefinition[];
