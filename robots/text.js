const algorithmia = require('algorithmia'),
    algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey,
    sentenceBoundaryDetection = require('sbd'),
    watsonApiKey = require('../credentials/watson-nlu.json').apikey,
    NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')

var nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey,
    version: '2018-11-16',
    url: "https://gateway-syd.watsonplatform.net/natural-language-understanding/api"

})

async function robot(content) {

    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    limitMaxumumSentences(content)
    await fetchKeywordsOfAllSentences(content)

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponse = await wikipediaAlgorithm.pipe({
            lang: 'pt',
            articleName: content.searchTerm
        })
        const wikipediaContent = wikipediaResponse.get()

        content.sourceContentOriginal = wikipediaContent.content

    }

    async function sanitizeContent(content) {

        const withoutBlankLines = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLines)

        content.sourceContentSanitized = withoutDatesInParentheses

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n')

            const withoutBlankLinesAndMarkdown = allLines.filter(line => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) return false

                return true
            })

            return withoutBlankLinesAndMarkdown.join(' ')
        }





        function removeDatesInParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
        }

    }

    function breakContentIntoSentences(content) {
        content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach(sentence => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }

}

function limitMaxumumSentences(content) {
    return content.sentences = content.sentences.slice(0, content.maximunSentences)
}

async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
        nlu.analyze({
            text: sentence,
            features: {
                keywords: {}
            }
        }, (error, response) => {
            if (error) throw error

            const keywords = response.keywords.map(keyword => keyword.text)

            resolve(keywords)

        })
    })
}

async function fetchKeywordsOfAllSentences(content) {
    for (sentence of content.sentences) {
        sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
    }
}

module.exports = robot