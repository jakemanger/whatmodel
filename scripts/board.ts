// The leaderboard exactly as `curl whatmodel.sh` prints it, computed from this repo's data.
//   npm run board -- "ram=32&gpu=apple"
//   npm run board -- image "ram=64&gpu=card&vram=24&format=json"
import { leaderboard } from "../lib/api.ts";
import { isCategory } from "../lib/categories.ts";

const args = process.argv.slice(2);
const cat = isCategory(args[0]) ? args.shift()! : null;
const query = (args[0] ?? "").replace(/^\?/, "");
const url = new URL(`https://whatmodel.sh/${cat ?? ""}?${query}`);
const res = leaderboard(new Request(url), cat);
process.stdout.on("error", (e: NodeJS.ErrnoException) => { if (e.code === "EPIPE") process.exit(0); throw e; });
process.stdout.write(await res.text());
