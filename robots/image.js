const imageDownloader = require('image-downloader')
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')
const googlecloud = require('./../credentials/google-search.json')

async function robot() {
    const content = state.load()
    await downloadAllImages(content)
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

    async function downloadAllImages(content) {
        content.downloadedImages = []
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            const images = content.sentences[sentenceIndex].images

            for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
                const imageUrl = images[imageIndex]

                try {

                    if (content.downloadedImages.includes(imageUrl)) {
                        throw new Error('Imagem já foi baixada')
                    }

                    await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)
                    content.downloadedImages.push(imageUrl)

                    console.log(`> [${sentenceIndex}][${imageIndex}] Baixou imagem com sucesso: ${imageUrl}`)
                    break;
                } catch (error) {
                    console.log(`> [${sentenceIndex}][${imageIndex}] Erro ao baixar (${imageUrl}): ${error}`)
                }
            }
        }
    }

    async function downloadAndSave(url, filename) {
        return imageDownloader.image({
            url: url,
            dest: `./content/${filename}`
        })
    }

}

module.exports = robot