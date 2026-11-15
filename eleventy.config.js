import fs from "node:fs";

const site = JSON.parse(fs.readFileSync("./src/_data/site.json", "utf8"));
const MONTHS = ["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];

export default function (eleventyConfig) {
  // Znacznik wersji doklejany do adresów CSS i JS, żeby przeglądarki pobierały je od nowa po każdej publikacji
  eleventyConfig.addGlobalData("wersja", Date.now().toString(36));
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/img");

  // Adres zdjęcia z folderu mediów (poza repozytorium): {{ "2026/11/plik.jpg" | media }}
  eleventyConfig.addFilter("media", (p) => (p ? `${site.media}/${String(p).replace(/^\/+/, "")}` : ""));
  eleventyConfig.addFilter("dataPL", (d) => {
    const x = new Date(d);
    return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter("dataISO", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("limit", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("absolutny", (p) => new URL(p, site.url).href);

  // Wpisy: najnowsze pierwsze
  eleventyConfig.addCollection("wpisy", (api) =>
    api.getFilteredByGlob("src/aktualnosci/*.md").sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("kursy", (api) =>
    api.getFilteredByGlob("src/kursy/*.md").sort((a, b) => (a.data.kolejnosc || 99) - (b.data.kolejnosc || 99))
  );

  // W treści piszemy /media/rok/miesiac/plik.jpg – tu podmieniamy na właściwy adres folderu mediów
  eleventyConfig.addTransform("media-url", function (content) {
    if ((this.page.outputPath || "").endsWith(".html")) {
      return content.replaceAll('="/media/', `="${site.media}/`);
    }
    return content;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md"],
  };
}
