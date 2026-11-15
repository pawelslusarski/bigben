// Jednorazowy import treści z WordPressa (tools/wordpress-export.json) do plików Markdown.
// Uruchomienie: npm i -D turndown && node tools/import-wordpress.mjs
// UWAGA: nadpisuje pliki w src/aktualnosci, src/kursy i strony dokumentów.
import fs from "node:fs";
import TurndownService from "turndown";

const exp = JSON.parse(fs.readFileSync("tools/wordpress-export.json", "utf8"));
const media = JSON.parse(fs.readFileSync("tools/wordpress-media.json", "utf8"));
const UP = /https?:\/\/(?:www\.)?bigben\.edu\.pl\/wp-content\/uploads\//g;

const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&hellip;/g, "…");
const strip = (h) => decode(h.replace(/<[^>]+>/g, " ").replace(/\[\/?vc_[^\]]*\]/g, " ")).replace(/\s+/g, " ").trim();
const rel = (u) => (u ? u.replace(UP, "") : null);

// Podstrony: stary slug -> nowy plik / adres
const KURSY = {
  "mini-club-dzieci-3-5-letnie": { plik: "mini-club-3-5-lat", grupa: "dzieci", wMenu: "Dzieci 3–5 lat (Mini Club)", k: 1 },
  "dzieci-6-7-letnie": { plik: "kids-6-9-lat", grupa: "dzieci", wMenu: "Dzieci 6–9 lat (Kids)", k: 2 },
  "big-ben-juniors-czyli-kursy-jez-angielskiego-dla-dzieci-8-12-letnich": { plik: "juniors-10-12-lat", grupa: "dzieci", wMenu: "Dzieci 10–12 lat (Juniors)", k: 3 },
  "big-ben-teens-and-adults-czyli-kursy-dla-mlodziezy-i-doroslych": { plik: "teens-13-18-lat", grupa: "mlodziez", wMenu: "Młodzież 13–18 lat (Teens)", k: 4 },
  "kursy-przygotowujace-do-matury": { plik: "kurs-maturalny", grupa: "mlodziez", wMenu: "Kurs maturalny", k: 5 },
  "kursy-vip": { plik: "dorosli-kurs-standardowy", grupa: "dorosli", wMenu: "Dorośli – kurs standardowy", k: 6 },
  "konwersacje": { plik: "chitchat", grupa: "dorosli", wMenu: "Kurs konwersacyjny CHITCHAT", k: 7 },
  "szkolenia-dla-firm": { plik: "szkolenia-dla-firm", grupa: "dorosli", wMenu: "Szkolenia dla firm", k: 8 },
  "a1-movers": { plik: "cambridge-young-learners", grupa: "cambridge", wMenu: "Cambridge English Young Learners", k: 9 },
  "a2-flyers": { plik: "cambridge-a2-key", grupa: "cambridge", wMenu: "Cambridge English A2 Key", k: 10 },
  "kurs-pre-a1-starters": { plik: "cambridge-b1-preliminary", grupa: "cambridge", wMenu: "Cambridge English B1 Preliminary", k: 11 },
  "kursy-jezyka-angielskiego-przygotowujace-do-fce": { plik: "cambridge-b2-first", grupa: "cambridge", wMenu: "Cambridge English B2 First", k: 12 },
  "kurs-przygotowujace-do-egzaminu-miedzynarodowego-ielts": { plik: "cambridge-c1-advanced", grupa: "cambridge", wMenu: "Cambridge English C1 Advanced", k: 13 },
};
const STRONY = { "o-nas": "o-nas", "podreczniki": "podreczniki", "regulamin": "regulamin", "rodo": "rodo", "polityka-ochrony-maloletnich": "polityka-ochrony-maloletnich" };
// Strony zastąpione szablonami albo nieaktualne: dokąd przekierować stary adres
const INNE = {
  "zapisy26": "/zapisy/", "zapisy-kursy-stacjonarne": "/zapisy/", "deklaracja": "/zapisy/",
  "events": "/events/", "smart": "/events/", "lato23": "/events/", "zapisy24": "/events/",
  "plan-lekcji": "/plan-lekcji/", "ksiegarnia": "/podreczniki/",
  "covid-19": "/aktualnosci/", "komunikat": "/aktualnosci/", "wakacje-2019": "/aktualnosci/",
};

// Mapa starych adresów -> nowych (do linków w treści i do .htaccess)
const mapa = new Map();
for (const [s, k] of Object.entries(KURSY)) mapa.set(`/${s}/`, `/kursy/${k.plik}/`);
for (const [s, d] of Object.entries(INNE)) if (`/${s}/` !== d) mapa.set(`/${s}/`, d);
const wpisPlik = (p) => `${p.date.slice(0, 10)}-${p.slug}`;
for (const p of exp.posts) mapa.set(new URL(p.link).pathname, `/aktualnosci/${p.slug}/`);

mapa.set("/zapisy2/", "/zapisy/"); mapa.set("/zapisy24-2/", "/events/"); mapa.set("/zapisy-2020/", "/zapisy/"); mapa.set("/zapisy-2021/", "/zapisy/");
const ZNANE = new Set(["/", "/kursy/", "/aktualnosci/", "/kontakt/", "/zapisy/", "/events/", "/plan-lekcji/", ...Object.values(STRONY).map((x) => `/${x}/`), ...mapa.values()]);

const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", emDelimiter: "*" });
td.keep(["iframe", "dl", "table", "u"]);
td.addRule("center", { filter: "center", replacement: (c) => `\n\n${c}\n\n` });

function czysc(html) {
  let h = html;
  h = h.replace(/<div class=['"]activenow-form-container[\s\S]*?<\/div>/g, "");
  h = h.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
  h = h.replace(/<blockquote class="wp-embedded-content"[\s\S]*?<\/blockquote>/g, "").replace(/<iframe[^>]*class="wp-embedded-content"[\s\S]*?<\/iframe>/g, "");
  h = h.replace(/<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([\w-]+)[^"]*"[^>]*><\/iframe>/g,
    (_, id) => `<div class="wideo"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Film YouTube" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`);
  h = h.replace(/\s(?:srcset|sizes|decoding|fetchpriority|data-[\w-]+)="[^"]*"/g, "");
  h = h.replace(/\[\/?vc_[^\]]*\]/g, "").replace(/\[\/?(?:dt_|ultimate_|rev_)[^\]]*\]/g, "");
  h = h.replace(UP, "/media/");
  // linki wewnętrzne -> nowe adresy; linki do nieistniejących już stron załączników WordPressa są zdejmowane
  h = h.replace(/<a\s[^>]*href=["']https?:\/\/(?:www\.)?bigben\.edu\.pl(\/[^"']*)?["'][^>]*>([\s\S]*?)<\/a>/g, (_, p = "/", srodek) => {
    const kotwica = (p.match(/#.*$/) || [""])[0];
    let s = p.replace(/[?#].*$/, "");
    if (!s.endsWith("/") && !/\.\w+$/.test(s)) s += "/";
    const cel = mapa.get(s) || s;
    if (!ZNANE.has(cel) && !cel.startsWith("/wp-content/")) return srodek.includes("<img") ? srodek : `<a href="${cel}">${srodek}</a>`;
    return `<a href="${cel}${kotwica}">${srodek}</a>`;
  });
  return h;
}
const md = (html) => td.turndown(czysc(html)).replace(/\n{3,}/g, "\n\n").trim() + "\n";
const fm = (o) => "---\n" + Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => `${k}: ${typeof v === "string" ? JSON.stringify(v) : v}`).join("\n") + "\n---\n\n";
const zajawka = (p) => {
  let t = strip(p.excerpt || "").replace(/\s*\[…\]\s*$/, "").replace(/…$/, "").trim();
  if (!t) t = strip(p.content);
  if (t.length > 210) t = t.slice(0, 210).replace(/\s+\S*$/, "") + "…";
  return t;
};

fs.mkdirSync("src/aktualnosci", { recursive: true });
fs.mkdirSync("src/kursy", { recursive: true });
let n = 0;
for (const p of exp.posts) {
  const m = media[p.slug];
  const pelny = m ? (m.full.w > 1600 && m.large ? m.large : m.full) : null;
  const maly = m ? (m.ml || m.large || m.full) : null;
  const tresc = md(p.content);
  const body = tresc.trim() ? tresc : "";
  // jeśli treść zaczyna się od tego samego obrazu co wyróżniający, nie pokazuj go dwa razy
  const ukryj = pelny && body.includes(rel(m.full.u).replace(/\.\w+$/, ""));
  fs.writeFileSync(`src/aktualnosci/${wpisPlik(p)}.md`, fm({
    title: decode(p.title), date: p.date.slice(0, 10), zajawka: zajawka(p),
    obraz: pelny && rel(pelny.u), obrazW: pelny?.w, obrazH: pelny?.h, obrazAlt: m?.alt || decode(p.title),
    obrazMaly: maly && rel(maly.u), obrazMalyW: maly?.w, obrazMalyH: maly?.h,
    ukryjObraz: ukryj ? true : null,
  }) + body);
  n++;
}
for (const p of exp.pages) {
  if (KURSY[p.slug]) {
    const k = KURSY[p.slug];
    fs.writeFileSync(`src/kursy/${k.plik}.md`, fm({ title: decode(p.title), wMenu: k.wMenu, grupa: k.grupa, kolejnosc: k.k, opis: zajawka(p) }) + md(p.content));
    n++;
  } else if (STRONY[p.slug]) {
    fs.writeFileSync(`src/${STRONY[p.slug]}.md`, fm({ layout: "page.njk", title: decode(p.title), permalink: `/${STRONY[p.slug]}/`, opis: zajawka(p) }) + md(p.content));
    n++;
  }
}
const lista = [...mapa].filter(([z, d]) => z !== d).map(([z, d]) => ({ z, do: d }));
fs.writeFileSync("src/_data/przekierowania.json", JSON.stringify(lista, null, 1));
console.log(`Zapisano ${n} plików, ${lista.length} przekierowań.`);
