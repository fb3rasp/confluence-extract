const axios = require("axios")
const btoa = require("btoa")
const natural = require("natural")
const createCsvWriter = require("csv-writer").createObjectCsvWriter
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

const getPagesByLabels = async (instance, labels) => {
  try {
    const response = await instance.get(
      `/wiki/rest/api/content/search?cql=label=${labels[0]} OR label=${labels[1]}&expand=version,space,metadata.labels,metadata.sourceTemplateEntityId`
    )

    if (response.data) {
      return response.data.results.map((page) => ({
        id: page.id,
        status: page.status,
        title: page.title,
        version: page.version.number,
        spaceId: page.space.id,
        spaceName: page.space.name,
        updatedBy: page.version.by.displayName,
        updated: page.version.when,
        weburl: page._links.webui,
        templateId: page.metadata.sourceTemplateEntityId,
        labels: page.metadata.labels.results.map((label) => label.name),
        content: null,
        created: null,
        createdBy: null,
        views: null,
        viewersUnique: null,
        docTeam: null,
        docStatus: null,
        docOutcome: null,
        docDescription: null,
        docLastReviewed: null,
        docKeywords: null,
      }))
    }
    return []
  } catch (error) {
    console.error(error)
    return []
  }
}

const getPageHistory = async (instance, pageId) => {
  try {
    // ?expand=ownedBy,contributors,lastOwnedBy
    const response = await instance.get(
      `/wiki/rest/api/content/${pageId}/history`
    )
    if (response.data) {
      return response.data
    }
  } catch (error) {
    console.error(error)
    return []
  }
}

const getPageViews = async (instance, pageId) => {
  try {
    // ?expand=ownedBy,contributors,lastOwnedBy
    const response = await instance.get(
      `/wiki/rest/api/analytics/content/${pageId}/views`
    )
    if (response.data) {
      return response.data
    }
  } catch (error) {
    console.error(error)
    return []
  }
}

const getPageContent = async (instance, pageId) => {
  try {
    // ?expand=ownedBy,contributors,lastOwnedBy
    const response = await instance.get(
      `/wiki/api/v2/pages/${pageId}?body-format=view`
    )
    if (response.data) {
      return response.data.body.view.value
    }
  } catch (error) {
    console.error(error)
    return []
  }
}

const getPageViewers = async (instance, pageId) => {
  try {
    // ?expand=ownedBy,contributors,lastOwnedBy
    const response = await instance.get(
      `/wiki/rest/api/analytics/content/${pageId}/viewers`
    )
    if (response.data) {
      return response.data
    }
  } catch (error) {
    console.error(error)
    return []
  }
}

const getPageKeywords = async (instance, page) => {
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
  const pages = await getPagesByLabels(instance, labels)

  const title_tfidf = new natural.TfIdf()
  const all_tfidf = new natural.TfIdf()

  await Promise.all(
    pages.map(async (page) => {
      const content = await getPageContent(instance, page.id)
      page.content = content

      const history = await getPageHistory(instance, page.id)
      page.created = history.createdDate
      page.createdBy = history.createdBy.displayName

      const views = await getPageViews(instance, page.id)
      page.views = views.count

      const viewers = await getPageViewers(instance, page.id)
      page.viewersUnique = viewers.count

      const keywords = await getPageKeywords(instance, page)
      page.docKeywords = keywords

      await all_tfidf.addDocument(
        page.title + " " + striptags(await page.content)
      )
      await title_tfidf.addDocument(page.title)

      // console.log(page)
    })
  )

  const keywords = all_tfidf.listTerms(0 /* in document 0 */).splice(0, 50)
  console.log("## Content ==========")
  console.log(
    keywords.map((item) => ({
      term: item.term,
      tfidf: item.tfidf,
    }))
  )

  const titleKeywords = title_tfidf
    .listTerms(0 /* in document 0 */)
    .splice(0, 10)
  console.log("## Title ==========")
  console.log(
    titleKeywords.map((item) => ({
      term: item.term,
      tfidf: item.tfidf,
    }))
  )

  console.log(title_tfidf.idf("safe"))
}

loadData(instance, labels)

// csvWriter
//   .writeRecords(pages)
//   .then(() => console.log("The CSV file was written successfully"))
// })
