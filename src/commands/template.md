
# Here is the default template for creating a new command. (19th March, 2020)

## Simply copy paste this code

```javascript

const Command = require(`../../libs/commands`)
/**
 * Command's Class description
 * @author yourname
 */
class Ping extends Command {

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
         *  Define workflow in here
         *  -----------------------
         */
    }
}


module.exports.help = {
    start: Ping,
    name: `ping`,
    aliases: [`pong`, `p1ng`, `poing`],
    description: `Gives bot's ping`,
    usage: `ping`,
    group: `Server`,
    permissionLevel: 0,
    public: true,
    multiUser: false
}

```
