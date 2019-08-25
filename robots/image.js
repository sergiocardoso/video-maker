const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')
const googlecloud = require('./../credentials/google-search.json')

async function robot() {
    const content = state.load()
    await fetchImagesOfAllSentences(content)
    state.save(content)

    async function fetchImagesOfAllSentences(content) {
        for (const sentence of content.sentences) {
            const query = `${content.searchTerm} ${sentence.keywords[0]}`
            sentence.images = await fetchGoogleAndReturnImagesLinks(query)
            sentence.googleSearchQuery = query
        }
    }

    async function fetchGoogleAndReturnImagesLinks(query) {
        const response = await customSearch.cse.list({
            auth: googlecloud.apiKey,
            cx: googlecloud.searchEngineId,
            q: query,
            num: 2,
            searchType: 'image',
            imgSize: 'huge'
        });

        const imagesUrl = response.data.items.map((item) => {
            return item.link
        })

        return imagesUrl;
    }

}

module.exports = robot