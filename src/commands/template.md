
# Here is the default template for creating a new command. (7th June, 2020)

## Simply copy paste this code

```javascript
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require(`discord.js`)
/**
 * Command's Class description
 * @author yourname
 */
module.exports = {
    /**
     * Define the file name (without the extension!)
     * @required
     * @type {string}
     */
    name: `commandName`,
    /**
     * Define accepted aliases. User will be able to call the command with these alternative names.
     * @required
     * @type {object}
     */
    aliases: [`itscommand`, `cmdName`, `justCallMeCommand!`],
    /**
     * Make a short, clear and concise command's description
     * @required
     * @type {string}
     */
    description: `This is a command's template`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @required
     * @type {string}
     */
    usage: `command <withArgument>(Optional)`,
    /**
     * Define the minimum permission level to use the command. Refer to ./src/config/permissions.js for more info
     * @required
     * @type {number}
     */
    permissionLevel: 0,
    /**
     * Define if the command allows for a user as an arguement and needs the user metadata.
     * @required
     * @type {boolean}
     */
    multiUser: false,
    /**
     * Define if the command is an application command or not. If it is, it will be available to all guilds. (Application commands are slash commands)
     * @required
     * @type {boolean}
     */
    applicationCommand: false,
    /**
     * Define if the command is a regualr text command or not. If it is, it will be available to all guilds. (message commands are for example '!help')
     * @required
     * @type {boolean}
     */
    messageCommand: false,
    /**
     * Define if the command is immune to the prefix.
     * @required ONLY for ***setprefix*** command
     * @type {boolean}
     */
    prefixImmune: true,
    /**
     * Use 'PermissionFlagsBits' to define the command's Permission level. (Most of the time you will not need to define this)
     * By seeting this property only users with the same or higher permission level will be able to use and see the command.
     * @Optional Only if applicationCommand is true and you need specific permissions
     * @type {PermissionFlagsBits}
     */
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    /**
     * Define the command's options. This is what is used as an argument for the command (Application commands only).
     * @required for ONLY ApplicationCommands
     * @type {Array}
     */
    options: [{
        name: `optionname`, // Must be all lowercase
        description: `This is an option's template`,
        required: true,
        type: ApplicationCommandOptionType.String
    }],
    /**
     * Use 'ApplicationCommandType' to define the command's type. (Most of the time it will always be 'ChatInput')
     * @required Only if applicationCommand is true
     * @type {ApplicationCommandType}
     */
    type: ApplicationCommandType.ChatInput,
    /**
     * Any other properties you want to add to the command.
     */
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, message, arg, locale]
     * @required Only for MessageCommands
     * @type {function}
     */
    async execute(client, reply, message, arg, locale) {
        // ... Your command ran here.
    },
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, interaction, options, locale]
     * @required Only for ApplicationCommands
     * @type {function}
     */
    async Iexecute(client, reply, interaction, options, locale) {
        // ... Your command ran here.
    }
}
```
