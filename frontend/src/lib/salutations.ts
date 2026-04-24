// Client-side mini salutation pool for preview. Mirrors salutations.py.

import type { DayType } from "./dayClassifier";

const POOL: Record<string, string[]> = {
  first_day: ["Începe călătoria, {name}.", "O nouă pagină, {name}."],
  last_day: ["Ai reușit, {name}.", "Capăt de drum, {name}."],
  celebration: ["Azi e al tău, {name}.", "Cu bucurie, {name}!"],
  holiday: ["Sărbători binecuvântate, {name}.", "Cu gânduri bune, {name}."],
  reflection: [
    "Oprește-te o clipă, {name}.",
    "Privește înăuntru, {name}.",
    "Ascultă-te, {name}.",
  ],
  rest: [
    "Respiră adânc, {name}.",
    "Odihnă liniștită, {name}.",
    "Azi n-ai nicio obligație, {name}.",
  ],
  productive: [
    "Hai la treabă, {name}!",
    "Azi e al tău, {name}.",
    "Fă-ți datoria cu drag, {name}.",
  ],
  general: ["O zi bună, {name}.", "Respiră și continuă, {name}."],
};

const DAY_TYPE_TO_KEY: Record<DayType, string> = {
  first: "first_day",
  last: "last_day",
  celebration: "celebration",
  holiday: "holiday",
  reflection: "reflection",
  rest: "rest",
  productive: "productive",
  general: "general",
};

export function pickSalutation(
  dayType: DayType,
  name: string,
  seed: number
): string {
  const key = DAY_TYPE_TO_KEY[dayType];
  const arr = POOL[key] ?? POOL.general;
  return arr[seed % arr.length].replace("{name}", name || "prieten");
}
