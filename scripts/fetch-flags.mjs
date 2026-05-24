/**
 * Fetches country flags from https://ru.wikipedia.org/wiki/Флаги_государств
 */

import fs from "fs";

const root = new URL("..", import.meta.url).pathname;
const outPath = `${root}src/data/country-flags.ts`;
const PAGE = "Флаги_государств";
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
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  return res.json();
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
}

function stripTags(html) {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, "")).trim();
}

function parseGallery(html) {
  const items = [];
  const galleryRe =
    /<li[^>]*class="[^"]*gallerybox[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = galleryRe.exec(html)) !== null) {
    const block = match[1];
    const imgMatch = block.match(
      /<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?/i,
    );
    if (!imgMatch) continue;

    let imgUrl = imgMatch[1];
    if (imgUrl.startsWith("//")) imgUrl = `https:${imgUrl}`;

    const thumbMatch = imgUrl.match(/\/commons\/thumb\/(.+)\/\d+px-[^/]+$/);
    if (thumbMatch) {
      imgUrl = `https://upload.wikimedia.org/wikipedia/commons/${thumbMatch[1]}`;
    }

    const captionMatch = block.match(
      /<div[^>]*class="[^"]*gallerytext[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    );
    if (!captionMatch) continue;

    const captionHtml = captionMatch[1];
    const countryLinks = [
      ...captionHtml.matchAll(
        /<a[^>]+href="\/wiki\/[^"]+"[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      ),
    ];

    const countryLink = countryLinks.find(([, title]) => {
      const t = stripTags(title);
      return !t.startsWith("Флаг") && !t.startsWith("Flag");
    });

    if (!countryLink) continue;

    let country = stripTags(countryLink[1]);
    country = country.replace(/\s*\([^)]*\)\s*$/, "").trim();
    if (!country || country.startsWith("Флаг")) continue;

    items.push({ country, imgUrl });
  }

  return items;
}

const data = await wikiGet({
  action: "parse",
  page: PAGE,
  prop: "text",
  disableeditsection: "1",
});

const html = data.parse?.text?.["*"];
if (!html) throw new Error("Failed to parse Wikipedia page");

const raw = parseGallery(html);
const byCountry = new Map();
for (const item of raw) {
  if (!byCountry.has(item.country)) {
    byCountry.set(item.country, item);
  }
}

const flags = [...byCountry.values()].sort((a, b) =>
  a.country.localeCompare(b.country, "ru"),
);

console.log(`Parsed ${raw.length} gallery entries, ${flags.length} countries`);

const out = `export type CountryFlag = {
  country: string;
  imgUrl: string;
};

/** Data from https://ru.wikipedia.org/wiki/Флаги_государств */
export const COUNTRY_FLAGS: CountryFlag[] = ${JSON.stringify(flags, null, 2)};
`;

fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath}`);
