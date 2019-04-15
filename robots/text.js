const algorithmia = require('algorithmia');
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey;
const sentenceBoundryDetection = require('sbd');

async function robot(content) {
    
    await fetchContentFromWikipedia(content);
    sanitizeContent(content);
    breakContentintoSentences(content);

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