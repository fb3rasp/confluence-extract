module.exports.getPagesByLabels = async (instance, labels) => {
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

module.exports.getPageHistory = async (instance, pageId) => {
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

module.exports.getPageViews = async (instance, pageId) => {
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

module.exports.getPageContent = async (instance, pageId) => {
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

module.exports.getPageViewers = async (instance, pageId) => {
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
