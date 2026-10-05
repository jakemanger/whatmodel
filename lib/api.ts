import { isCategory } from "./categories.ts";
import { boardData } from "./board-data.ts";
import { leaderboardResponse } from "./api-response.ts";
import { SOURCES } from "./sources.ts";

const attributions = SOURCES.filter((s) => s.verdict === 'allowed').map((s) => ({
  name: s.name, source: s.terms_url, license: s.license,
  license_url: s.license_url ?? s.terms_url, attribution: s.attribution,
}));
export function leaderboard(req: Request, category: string | null) {
  return leaderboardResponse(req, boardData(isCategory(category) ? category : 'llm'), attributions);
}
