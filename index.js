const readLine = require('readline-sync');

function start() {
    const content = {};

    content.searchTerm = askAndReturnSearchTerm();
    content.prefix = askAndReturnPrefix();

    function askAndReturnSearchTerm() {
        return readLine.question('Type a Wikipedia search term: ');
    }

    function askAndReturnPrefix() {
        const prefixes = ['Who is', 'What is', 'The history of'];
        const selectedPrefixIndex = readLine.keyInSelect(prefixes, 'Chose one of theses: ');
        const selectedPrefixText = prefixes[selectedPrefixIndex];

        return selectedPrefixText;
    }

    console.log(content);
}

start();