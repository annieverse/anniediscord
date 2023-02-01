const { Collection } = require(`discord.js`)
const { readdirSync } = require(`fs`)

/**
 * Agreggate all the available commands into unified object.
 * @param {string} [path=`./src/commands`] Target commands directory path.
 * @return {void}
 */
module.exports = function componentLoader({ logger, client }) {
    const path = `./src/components/`
    const componentFolders = readdirSync(path)
    for (const folder of componentFolders) {
        const componentFiles = readdirSync(`${path}${folder}`).filter((file)=>file.endsWith(`.js`))

        // Create necessary collections as needed
        client.modals = new Collection()

        switch (folder) {
            case `modals`:
                for (const file of componentFiles) {
                    const modal = require(`../components/${folder}/${file}`)
                    client.modals.set(modal.data.name, modal)
                }
            default:
                break
        }
    }
    logger.info(`All component files loaded`)
}