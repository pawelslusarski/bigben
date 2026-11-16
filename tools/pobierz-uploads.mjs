// Pobiera ze starego WordPressa wszystkie pliki biblioteki mediów, których nie ma jeszcze w src/media,
// tak żeby każdy stary adres /wp-content/uploads/... dało się przekierować do /media/... (reguły w src/htaccess.njk).
// Zdjęcia (JPG/PNG) są zmniejszane do 1600 px i zapisywane jako WebP; pozostałe pliki (PDF, MP4, HTML, HEIC) kopiowane bez zmian.
// Uruchamiane z GitHub Actions (.github/workflows/import-zdjec.yml). Wymaga działającego starego WordPressa.
// Uruchomienie ręczne: npm i --no-save sharp && node tools/pobierz-uploads.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ZRODLO = process.env.ZRODLO || "https://bigben.edu.pl";
const MEDIA = "src/media";
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" };
const OBRAZ = /\.(jpe?g|png)$/i;
const rel = (u) => decodeURI(new URL(u, ZRODLO).pathname).replace(/^\/wp-content\/uploads\//, "");
// To samo przekształcenie robią reguły w .htaccess: usuwa końcówkę rozmiaru "-768x403" i zmienia rozszerzenie na .webp
const cel = (p) => (OBRAZ.test(p) ? p.replace(/(-\d+x\d+)?\.(jpe?g|png)$/i, ".webp") : p);

async function pobierz(url, proby = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) {
      if (i >= proby) throw e;
      await new Promise((ok) => setTimeout(ok, 1500 * i));
    }
  }
}

// 1. Lista wszystkich plików z biblioteki mediów
const zalaczniki = [];
for (let strona = 1, stron = 1; strona <= stron; strona++) {
  const r = await pobierz(`${ZRODLO}/wp-json/wp/v2/media?per_page=100&page=${strona}&_fields=id,source_url,media_details`);
  stron = Number(r.headers.get("x-wp-totalpages")) || 1;
  zalaczniki.push(...(await r.json()));
}

// 2. Dla każdego docelowego pliku wybierz najlepsze źródło (oryginał, a gdy go brak – największy rozmiar)
const cele = new Map(); // docelowa ścieżka -> { url, szer, dokladny }
const stare = [];
for (const z of zalaczniki) {
  const katalog = rel(z.source_url).replace(/[^/]+$/, "");
  const pliki = [{ p: rel(z.source_url), url: z.source_url, szer: z.media_details?.width || 0 }];
  for (const s of Object.values(z.media_details?.sizes || {})) {
    if (s.source_url) pliki.push({ p: rel(s.source_url), url: s.source_url, szer: s.width || 0 });
  }
  if (z.media_details?.original_image) {
    const p = katalog + z.media_details.original_image;
    pliki.push({ p, url: `${ZRODLO}/wp-content/uploads/${encodeURI(p)}`, szer: 99999 });
  }
  for (const f of pliki) {
    stare.push(f.p);
    const c = cel(f.p);
    const dokladny = c === f.p || c === f.p.replace(OBRAZ, ".webp");
    const jest = cele.get(c);
    if (!jest || (dokladny && !jest.dokladny) || (dokladny === jest.dokladny && f.szer > jest.szer)) cele.set(c, { ...f, dokladny });
  }
}

// 3. Pobierz to, czego brakuje
let nowe = 0, byly = 0, bajty = 0;
const bledy = [];
for (const [c, f] of cele) {
  const plik = path.join(MEDIA, c);
  if (fs.existsSync(plik)) { byly++; continue; }
  try {
    const dane = Buffer.from(await (await pobierz(new URL(f.url, ZRODLO).href)).arrayBuffer());
    const wynik = OBRAZ.test(f.p)
      ? await sharp(dane).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer()
      : dane;
    fs.mkdirSync(path.dirname(plik), { recursive: true });
    fs.writeFileSync(plik, wynik);
    nowe++; bajty += wynik.length;
  } catch (e) {
    bledy.push(`${f.p}: ${e.message}`);
  }
}

// 4. Lista starych adresów do sprawdzenia po publikacji
fs.writeFileSync("tools/stare-uploads.json", JSON.stringify([...new Set(stare)].sort(), null, 1) + "\n");
console.log(`Załączników: ${zalaczniki.length}, starych adresów: ${new Set(stare).size}, plików docelowych: ${cele.size}`);
console.log(`Już były: ${byly}, pobrano: ${nowe} (${(bajty / 1e6).toFixed(1)} MB), błędy: ${bledy.length}`);
if (bledy.length) { console.log(bledy.join("\n")); process.exitCode = 1; }
