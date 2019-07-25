const robots = {
    userInput: require('./robots/user-input'),
    text: require('./robots/text')
}

async function start() {
    const content = {}

    await robots.userInput(content)
    await robots.text(content)

    console.log(content)

}

start() 