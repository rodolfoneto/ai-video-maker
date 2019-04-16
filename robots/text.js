const algorithmia = require('algorithmia');
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey;
const sentenceBoundryDetection = require('sbd');

const watsonApiKey = require('../credentials/watson-nlu.json').apikey;
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js');

const nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey,
    version: '2018-04-05',
    url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
});

function limitMaximumSetence(content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences);
}

async function fetchKeywordsOfAllSentences(content) {
    for(const sentence of content.sentences) {
        sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text);
    }
}

async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
        nlu.analyze({
            text: sentence,
            features: {
                keywords: {}
            }
        }, (error, response) => {
            if(error) {
                throw error;
            }
            const keywords = response.keywords.map((keyword) => {
                return keyword.text;
            })
            resolve(keywords);
        });
    })
}


async function robot(content) {
    
    await fetchContentFromWikipedia(content);
    sanitizeContent(content);
    breakContentintoSentences(content);
    limitMaximumSetence(content);
    await fetchKeywordsOfAllSentences(content);

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey);
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2?timeout=300');
        const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm);
        const wikiPediaContent = wikipediaResponde.get();

        content.sourceContentOriginal = wikiPediaContent.content;

    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal);
        const withoutDatesInParentheses = removeDateInParentheses(withoutBlankLinesAndMarkdown);
        content.sourceContentSanitized = withoutDatesInParentheses;

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n');
            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if(line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false;
                }

                return true
            });

            return withoutBlankLinesAndMarkdown.join(' ');
        }

        function removeDateInParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' '); 
        }
    }

    function breakContentintoSentences(content) {
        content.sentences = [];
        const sentences = sentenceBoundryDetection.sentences(content.sourceContentSanitized);
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            });
        });
    }
}

module.exports = robot;