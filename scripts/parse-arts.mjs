import fs from "fs";

const html = fs.readFileSync("/tmp/arts-page.html", "utf8");

function parseHeader(text) {
  const cleaned = text.trim();
  const quoted = cleaned.match(/^(.+?)[,\s]*[«"](.+?)[»"]\s*$/);
  if (quoted) {
    return { author: quoted[1].replace(/,\s*$/, "").trim(), title: quoted[2].trim() };
  }
  const guillemet = cleaned.match(/^(.+?)\s+«(.+?)»\s*$/);
  if (guillemet) {
    return { author: guillemet[1].trim(), title: guillemet[2].trim() };
  }
  return { author: cleaned, title: cleaned };
}

function extractImgUrl(block) {
  const patterns = [
    /data-src="(https:\/\/atomnaya-romantika\.ru\/wp-content\/uploads\/[^"]+\.jpg)"/,
    /src="(https:\/\/atomnaya-romantika\.ru\/wp-content\/uploads\/[^"]+\.jpg)"/,
    /data-src="(https:\/\/atomnaya-romantika\.ru\/wp-content\/uploads\/[^"]+\.png)"/,
    /src="(https:\/\/atomnaya-romantika\.ru\/wp-content\/uploads\/[^"]+\.png)"/,
  ];
  for (const re of patterns) {
    const m = block.match(re);
    if (m && !m[1].includes("new_logo")) return m[1];
  }
  return "";
}

const contentStart = html.indexOf("<h1>Известные картины");
const contentEnd = html.indexOf("</div>", html.lastIndexOf("wp-caption"));
const content = html.slice(contentStart, contentEnd > 0 ? contentEnd + 5000 : undefined);

const h2Regex = /<h2>([^<]+)<\/h2>/g;
const arts = [];
let match;
const h2Matches = [...content.matchAll(h2Regex)];

for (let i = 0; i < h2Matches.length; i++) {
  const headerText = h2Matches[i][1];
  if (headerText.includes("100 самых")) continue;

  const blockStart = h2Matches[i].index;
  const blockEnd = i + 1 < h2Matches.length ? h2Matches[i + 1].index : content.length;
  const block = content.slice(blockStart, blockEnd);

  const { author, title } = parseHeader(headerText);

  const descParts = [];
  const pRegex = /<p>([^<]*(?:<[^/][^>]*>[^<]*)*)<\/p>/g;
  let pMatch;
  while ((pMatch = pRegex.exec(block)) !== null) {
    const text = pMatch[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text && !text.startsWith("caption")) descParts.push(text);
  }
  const description = descParts.join(" ").trim();
  const imgUrl = extractImgUrl(block);

  if (imgUrl) {
    arts.push({ author, title, description, imgUrl });
  }
}

console.log(`Parsed ${arts.length} paintings`);
if (arts.length !== 100) {
  console.warn("Expected 100, got", arts.length);
}
console.log(JSON.stringify(arts[0], null, 2));

const out = `export type Art = {
  author: string;
  title: string;
  description: string;
  imgUrl: string;
};

export const ARTS: Art[] = ${JSON.stringify(arts, null, 2)};
`;

fs.mkdirSync(new URL("../src/data", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../src/data/arts.ts", import.meta.url), out);
console.log("Written to src/data/arts.ts");
