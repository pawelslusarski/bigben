// Wpisy: plik RRRR-MM-DD-nazwa.md trafia pod adres /aktualnosci/nazwa/
export default {
  eleventyComputed: {
    layout: (data) => (data.page.inputPath.endsWith(".md") ? "post.njk" : data.layout),
    permalink: (data) =>
      data.page.inputPath.endsWith(".md")
        ? `/aktualnosci/${data.page.fileSlug.replace(/^\d{4}-\d{2}-\d{2}-/, "")}/`
        : data.permalink,
  },
};
