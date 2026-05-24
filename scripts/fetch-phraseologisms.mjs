/**
 * Fetches Russian phraseologisms from Wikipedia category and first-paragraph meanings.
 * https://ru.wikipedia.org/wiki/Категория:Русские_фразеологизмы
 */

import fs from "fs";
import { pathToFileURL } from "url";

const root = new URL("..", import.meta.url).pathname;
const outPath = `${root}src/data/phraseologisms.ts`;

const CATEGORY = "Category:Русские_фразеологизмы";
const API = "https://ru.wikipedia.org/w/api.php";

async function wikiGet(params) {
  const url = new URL(API);
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "art-quiz/0.1 (educational quiz; local dev)" },
  });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}: ${url}`);
  return res.json();
}

async function fetchCategoryMembers() {
  const titles = [];
  let cmcontinue;

  do {
    const data = await wikiGet({
      action: "query",
      list: "categorymembers",
      cmtitle: CATEGORY,
      cmlimit: "500",
      cmtype: "page",
      ...(cmcontinue ? { cmcontinue } : {}),
    });

    for (const m of data.query?.categorymembers ?? []) {
      if (m.ns === 0) titles.push(m.title);
    }
    cmcontinue = data.continue?.cmcontinue;
  } while (cmcontinue);

  return titles.sort((a, b) => a.localeCompare(b, "ru"));
}

function firstParagraph(extract) {
  if (!extract) return "";
  const text = extract.trim();
  const block = text.split(/\n\n+/)[0]?.trim() ?? text;
  const line = block.split(/\n/)[0]?.trim() ?? block;
  return line;
}

async function fetchExtracts(titles) {
  const batchSize = 20;
  const results = new Map();

  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize);
    const data = await wikiGet({
      action: "query",
      prop: "extracts",
      explaintext: "1",
      exintro: "1",
      titles: batch.join("|"),
    });

    for (const page of Object.values(data.query?.pages ?? {})) {
      if (page.missing !== undefined) continue;
      const meaning = firstParagraph(page.extract);
      if (meaning) {
        results.set(page.title, meaning);
      }
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}

const titles = await fetchCategoryMembers();
console.log(`Category members: ${titles.length}`);

const extracts = await fetchExtracts(titles);
const items = titles
  .filter((title) => extracts.has(title))
  .map((title) => ({ phrase: title, meaning: extracts.get(title) }));

console.log(`With first paragraph: ${items.length}`);

const out = `export type Phraseologism = {
  phrase: string;
  meaning: string;
};

/** Data from https://ru.wikipedia.org/wiki/Категория:Русские_фразеологизмы (first intro paragraph per article). */
export const PHRASEOLOGISMS: Phraseologism[] = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath}`);
