
# Here is the default template for creating a new command. (19th March, 2020)

## Simply copy paste this code

```javascript

const Command = require(`../../libs/commands`)
/**
 * Command's Class description
 * @author yourname
 */
class CommandName extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({}) {

        /**
         * This method is used to fetch user data.
         * Set the parameter to 1 for first-block data level (only returning user object)
         * or set to 2 for second-block data level to get the complete user's metadata (inventories, exp, etc)
         * Later you can access the data through `this.user`
         * REMOVE THIS LINE IF user data isn't needed in this command workflow.
         */
        await this.requestUserMetadata(2)

        /**
         *  -----------------------
         *  Define workflow below here
         *  -----------------------
         */
    }
}


module.exports.help = {
    /**
     * Refer to the class of this file
     * @type {Class}
     */
    start: CommandName,
    /**
     * Define the file name (without the extension!)
     * @type {String}
     */
    name: `commandName`,
    /**
     * Define accepted aliases. User will be able to call the command with these alternative names.
     * @type {ArrayOfString}
     */
    aliases: [`itscommand`, `cmdName`, `justCallMeCommand!`],
    /**
     * Make a short, clear and concise command's description
     * @type {String}
     */
    description: `This is a command's template`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @type {String}
     */
    usage: `command <withArgument>(Optional)`,
    /**
     * Define the command's group. Follow the name of parent folder where you stored this command
     * @type {String}
     */
    group: `Server`,
    /**
     * Define the minimum permission level to use the command. Refer to ./src/config/permissions.js for more info
     * @type {Number}
     */
    permissionLevel: 0,
    /**
     * Set this to false if the command doesn't have the option to target different user
     * EXAMPLE W/O MULTIUSER PROP: <Ping>/<Stats>/<Pixiv>
     * EXAMPLE w/ MULTIUSER PROP: <Profile>/<Balance>/<Avatar>
     * @type {Boolean}
     */
    multiUser: false
}

```
