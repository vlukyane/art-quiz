import fs from "fs";
import { pathToFileURL } from "url";

const root = new URL("..", import.meta.url).pathname;
const artsPath = `${root}src/data/arts.ts`;

const { ARTS } = await import(
  pathToFileURL(`${root}src/data/arts.ts`).href
);
const { getAuthorBio, normalizeAuthor } = await import(
  pathToFileURL(`${root}src/data/author-bios.ts`).href
);

const enriched = ARTS.map((art) => {
  const author = normalizeAuthor(art.author);
  const bio = getAuthorBio(author) ?? "";
  return {
    author,
    title: art.title,
    description: art.description,
    imgUrl: art.imgUrl,
    bio,
  };
});

const out = `export type Art = {
  author: string;
  title: string;
  description: string;
  imgUrl: string;
  bio: string;
};

export const ARTS: Art[] = ${JSON.stringify(enriched, null, 2)};
`;

fs.writeFileSync(artsPath, out);
console.log(`Enriched ${enriched.length} entries with bio`);
