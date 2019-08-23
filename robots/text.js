const algorithmia = require('algorithmia')
const apiKey = require('./../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(apiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated
            .algo("web/WikipediaParser/0.1.2?timeout=300")
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()

        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesinParentheses = removeDatesinParentheses(withoutBlankLinesAndMarkdown)

        content.sourceContentSanitized = withoutDatesinParentheses

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split("\n");
            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                } else {
                    return true
                }
            })
            return withoutBlankLinesAndMarkdown.join(' ');
        }

        function removeDatesinParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
        }
    }

    function breakContentIntoSentences(content) {
        content.sentences = []
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })

    }
}

module.exports = robot