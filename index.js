const axios = require("axios")
const btoa = require("btoa")
const createCsvWriter = require("csv-writer").createObjectCsvWriter
const pageKeywords = require("./content/pageKeywords")
const pageService = require("./content/pageService")
const natural = require("natural")
const striptags = require("striptags")

require("dotenv").config()

const labels = ["introduction", "options"]

let _pageCollection = []

const csvWriter = createCsvWriter({
  path: "out.csv",
  header: [
    { id: "id", title: "ID" },
    { id: "title", title: "TITLE" },
    { id: "status", title: "STATUS" },
    { id: "version", title: "VERSION" },
  ],
})

const authString = `${process.env.CONFLUENCE_USERNAME}:${process.env.CONFLUENCE_API_KEY}`
const headers = {
  Authorization: `Basic ${btoa(authString)}`,
  Accept: "application/json",
  "Content-Type": "application/json",
}

const instance = axios.create({
  baseURL: `https://${process.env.CONFLUENCE_DOMAIN}/`,
  timeout: 1000,
  headers: headers,
})

const loadData = async (instance, labels) => {
  const pages = await pageService.getPagesByLabels(instance, labels)

  const title_tfidf = new natural.TfIdf()
  const all_tfidf = new natural.TfIdf()

  await Promise.all(
    pages.map(async (page) => {
      const content = await pageService.getPageContent(instance, page.id)
      page.content = content

      const history = await pageService.getPageHistory(instance, page.id)
      page.created = history.createdDate
      page.createdBy = history.createdBy.displayName

      const views = await pageService.getPageViews(instance, page.id)
      page.views = views.count

      const viewers = await pageService.getPageViewers(instance, page.id)
      page.viewersUnique = viewers.count

      const keywords = await pageKeywords.getPageKeywords(page)
      page.docKeywords = keywords

      // await all_tfidf.addDocument(
      //   page.title + " " + striptags(await page.content)
      // )
      console.log(page.title)
      await title_tfidf.addDocument(page.title)

      console.log(page.id)
    })
  )
  console.log("test")

  // const keywords = await all_tfidf
  //   .listTerms(0 /* in document 0 */)
  //   .splice(0, 50)
  // console.log("## Content ==========")
  // console.log(
  //   keywords.map((item) => ({
  //     term: item.term,
  //     tfidf: item.tfidf,
  //   }))
  // )

  console.log(title_tfidf)

  const titleKeywords = await title_tfidf
    .listTerms(0 /* in document 0 */)
    .splice(0, 10)
  console.log("## Title ==========")
  console.log(
    titleKeywords.map((item) => ({
      term: item.term,
      tfidf: item.tfidf,
    }))
  )

  console.log(
    await title_tfidf
      .listTerms(1 /* in document 0 */)
      .splice(0, 10)
      .map((item) => ({
        term: item.term,
        tfidf: item.tfidf,
      }))
  )

  // console.log(title_tfidf.idf("safe"))
}

loadData(instance, labels)

// csvWriter
//   .writeRecords(pages)
//   .then(() => console.log("The CSV file was written successfully"))
// })
