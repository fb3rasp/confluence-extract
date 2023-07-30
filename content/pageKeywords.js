const natural = require("natural")
const striptags = require("striptags")

module.exports.getPageKeywords = async (page) => {
  const tfidf = new natural.TfIdf()
  tfidf.addDocument(page.title + " " + striptags(await page.content))

  const keywords = tfidf.listTerms(0 /* in document 0 */).splice(0, 10)
  if (keywords) {
    return keywords.map((item) => ({
      term: item.term,
      tfidf: item.tfidf,
    }))
  } else {
    return []
  }
}
