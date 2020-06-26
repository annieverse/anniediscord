const Command = require(`../../libs/commands`)
const { realpath } = require("fs-nextra")
/**
 * Manage custom configs per sever
 * @author Frying Pan
 */
class Config extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.customizable = this.bot.configClass.getCustomizableConfig
        this.notCustomizable = this.bot.configClass.getNotCustomizable
        this.required = this.bot.configClass.getRequired
        this.link = this.message.url
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({reply}) {
        this.customizableOptions
        let options = Object.keys(this.customizable).join(`\n`).split(`\n`)
        let res = []
        for (let index = 0; index < options.length; index++) {
            const element = options[index];
            res.push({"name": "Hover for Details","value": `[${element}](${this.link} "[${index}] true\\false")`})
        }
        reply(``,{
            columns: res
        })
    }

    get customizableOptions(){
        for (let index = 0; index < this.notCustomizable.length; index++) {
            delete this.customizable[this.notCustomizable[index]]
        }
        let options = Object.keys(this.customizable).join(`\n`).split(`\n`)
        for (let index = 0; index < options.length; index++) {
            if (options[index].includes("modmail"))  delete this.customizable[options[index]]
        }
    }
}

module.exports.help = {
    start: Config,
    name: `config`,
    aliases: [],
    description: `Manage your settings for your server for the bot`,
    usage: `config <setting>`,
    group: `Manager`,
    permissionLevel: 0,
    multiUser: false
}

