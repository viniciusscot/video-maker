const robots = {
    userInput: require('./robots/user-input'),
    text: require('./robots/text')
}

async function start() {
    const content = {
        maximunSentences: 7,
        searchTerm: 'Michael Jackson'
    }

    // await robots.userInput(content)
    await robots.text(content)

    console.log(JSON.stringify(content, null, 4))

}

start() 