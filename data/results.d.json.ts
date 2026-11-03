// Runtime validation lives in scripts/check.ts. Give the large JSON table its
// reviewed schema without inferring a union of every individual result row.
import type { Result } from "../lib/types.ts";
declare const results: Result[];
export default results;
