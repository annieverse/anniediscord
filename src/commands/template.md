
# Here is the default template for creating a new command. (7th June, 2020)

## Simply copy paste this code

```javascript
/**
 * Command's Class description
 * @author yourname
 */
module.exports {
    /**
     * Define the file name (without the extension!)
     * @type {string}
     */
    name: `commandName`,
    /**
     * Define accepted aliases. User will be able to call the command with these alternative names.
     * @type {object}
     */
    aliases: [`itscommand`, `cmdName`, `justCallMeCommand!`],
    /**
     * Make a short, clear and concise command's description
     * @type {string}
     */
    description: `This is a command's template`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @type {string}
     */
    usage: `command <withArgument>(Optional)`,
    /**
     * Define the minimum permission level to use the command. Refer to ./src/config/permissions.js for more info
     * @type {number}
     */
    permissionLevel: 0,
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, message, arg, locale]
     * @type {function}
     */
    async execute(client, reply, message, arg, locale) {
        // ... Your command ran here.
    }

}
```
