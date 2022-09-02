const { Collection } = require(`discord.js`)
const fs = require(`fs`)

/**
 * Agreggate all the available commands into unified object.
 * @param {string} [path=`./src/commands`] Target commands directory path.
 * @return {void}
 */
module.exports = function commandsLoader({ path = `./src/commands/` }) {
    const MESSAGE_COMMANDS = new Collection()
    const APPLICATION_COMMANDS = new Collection()
        /**
         * Recursively pull available categories in command's root directory
         * @example user/system/social/shop/etc
         */
    let directories = fs.readdirSync(path).filter(file => !file.includes(`.`))
    function isApplicationCommand(command) {
        return command.applicationCommand
    }
    function isMessageCommand(command) {
        return command.messageCommand
    }
    for (const index in directories) {
        const dir = directories[index]
            /**
             * Recursively pull files from a category
             * @example user/system/social/shop/etc
             */
        const files = fs.readdirSync(path + dir)
        const jsfile = files.filter(f => f.split(`.`).pop() === `js`)
        for (let i = 0; i < jsfile.length; i++) {
            const file = jsfile[i]
            const src = require(`./${dir}/${file}`)
            const metadata = Object.keys(src)
                //  Skip command with deprecated structure
            if (metadata.includes(`help`)) continue
                //  Group labeling
                src.group = dir
            if (isApplicationCommand(src)) APPLICATION_COMMANDS.set(src.name, src)
            if (isMessageCommand(src)) MESSAGE_COMMANDS.set(src.name, src)
        }
    }

    return {MESSAGE_COMMANDS, APPLICATION_COMMANDS}
}