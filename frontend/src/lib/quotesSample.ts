// ~30 quotes for client-side preview. Mirrors a subset of quotes.py.

import type { QuoteStyle } from "@/types/calendar.types";

export interface PreviewQuote {
  text: string;
  author: string;
  style: QuoteStyle;
  pools: Array<"productive" | "rest" | "reflection" | "celebration" | "general">;
}

export const PREVIEW_QUOTES: PreviewQuote[] = [
  {
    text: "Obstacolul devine drumul.",
    author: "Marc Aureliu",
    style: "stoic",
    pools: ["productive"],
  },
  {
    text: "Fii ca stânca de care se sparg valurile.",
    author: "Marc Aureliu",
    style: "stoic",
    pools: ["rest", "reflection"],
  },
  {
    text: "Ai putere asupra minții tale — nu asupra evenimentelor.",
    author: "Marc Aureliu",
    style: "stoic",
    pools: ["productive", "reflection"],
  },
  {
    text: "Obiceiurile sunt dobânzile pe care le plătești sau le încasezi la viața ta.",
    author: "James Clear",
    style: "modern",
    pools: ["productive"],
  },
  {
    text: "Focus nu înseamnă să spui da. Înseamnă să spui nu.",
    author: "Steve Jobs",
    style: "modern",
    pools: ["productive"],
  },
  {
    text: "Ceea ce cauți te caută.",
    author: "Rumi",
    style: "spiritual",
    pools: ["reflection", "general"],
  },
  {
    text: "A merge lent e a avea timp să vezi.",
    author: "Thich Nhat Hanh",
    style: "spiritual",
    pools: ["rest", "reflection"],
  },
  {
    text: "Omul e un drum între două tăceri.",
    author: "Lucian Blaga",
    style: "romanian_authors",
    pools: ["reflection"],
  },
  {
    text: "Fericirea e o formă de curaj.",
    author: "Gabriel Liiceanu",
    style: "romanian_authors",
    pools: ["celebration", "general"],
  },
  {
    text: "Trebuie să ni-l imaginăm pe Sisif fericit.",
    author: "Albert Camus",
    style: "existentialist",
    pools: ["reflection", "productive"],
  },
  {
    text: "Cel care are un de ce, rezistă oricărui cum.",
    author: "F. Nietzsche / V. Frankl",
    style: "existentialist",
    pools: ["productive", "reflection"],
  },
  {
    text: "Azi sărbătorește o respirație întreagă.",
    author: "Thich Nhat Hanh",
    style: "spiritual",
    pools: ["celebration", "rest"],
  },
];

export function pickQuote(
  pool: "productive" | "rest" | "reflection" | "celebration" | "general",
  styles: QuoteStyle[],
  seed: number
): PreviewQuote {
  const filtered = PREVIEW_QUOTES.filter(
    (q) => styles.includes(q.style) && q.pools.includes(pool)
  );
  const base = filtered.length ? filtered : PREVIEW_QUOTES;
  return base[seed % base.length];
}
