const imageDownloader = require('image-downloader');
const google = require('googleapis').google;
const customSearch = google.customsearch('v1');
const state = require('./state.js');

const googleSearchCredentials = require('../credentials/google-search.json');

async function robot() {
    const content = state.load();

    await fetchImagesOfAllSentences(content);
    await downloadAllImages(content);

    state.save(content);

    async function fetchImagesOfAllSentences(content) {
        for (const sentence of content.sentences) {
            const query = `${content.searchTerm} ${sentence.keywords[0]}`;
            sentence.images = await fetchGoogleAndReturnImagesLink(query);


            sentence.googleSearchQuery = query;
        }
    }

    async function fetchGoogleAndReturnImagesLink(query) {
        const response = await customSearch.cse.list({
            auth: googleSearchCredentials.apiKey,
            cx: googleSearchCredentials.searchEngineId,
            q: query,
            searchType: 'image',
            num: 2
        });
        const imagesUrl = response.data.items.map((item) => {
            return item.link;
        });
        return imagesUrl;
    }

    async function downloadAllImages(content) {
        content.downloadedImages = [];

        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            const imagesArray = content.sentences[sentenceIndex].images;
            
            for(let imageIndex = 0; imageIndex < imagesArray.length; imageIndex++) {
                const imageUrl = imagesArray[imageIndex];

                try {
                    if(content.downloadedImages.includes(imageUrl)) {
                        throw new Error(`Imagem em duplicidade`);
                    }
                    await imageDownloadAndSave(imageUrl, `${sentenceIndex}-original.png`);
                    content.downloadedImages.push(imageUrl);
                    console.log(`Image baixada com sucesso na Url: ${imageUrl}`);
                    break;
                } catch(error) {
                    console.log(`Erro no download da imagem na URL: ${imageUrl}, Erro: ${error}`);
                }
            }
        }
    }

    async function imageDownloadAndSave(imageUrl, fileName) {
        return imageDownloader.image({
            url: imageUrl,
            dest: `./content/${fileName}`
        });
    }
}

module.exports = robot;