const { expect } = require(`chai`)
const CommandsLoader = require(`../src/commands/loader`)
/**
 * @reference ./src/commands/loader.js
 */
describe(`Commands Loader`, () => {

    it(`.getJsFiles() should able to only returns .js files`, () => {
        const dummyArray = [`apple.js`, `orange.js`, `pear.cpp`]
        const res = new CommandsLoader().getJsFiles(dummyArray)
        res.map(file => {
            expect(file).to.contain(`.js`)
        })
    })

    it(`.register() should able set command's properties correctly`, () => {
        const res = new CommandsLoader().register(`developer`, `eval`, true)
        const references = [
            `start`,
            `name`,
            `aliases`, 
            `description`, 
            `usage`, 
            `group`,
            `public`, 
            `permissionLevel`,
            `multiUser`
        ]
        Object.keys(res.commands.get(`eval`).help).map(prop => expect(references).to.include(prop))
    })
})
