module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("script.js");
  eleventyConfig.addPassthroughCopy("assets");

  // Add a collection for search indexing
  eleventyConfig.addCollection("searchable", function(collectionApi) {
    return collectionApi.getAll().filter(item => {
      return item.data.title && item.url;
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
