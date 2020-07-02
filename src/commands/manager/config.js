const Command = require(`../../libs/commands`)
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
        this.valueOptions = this.bot.configClass.getCustomizableConfigValueOptions
        this.required = this.bot.configClass.getRequired
        this.link = this.message.url
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({reply, bot:{db}}) {
        this.customizableOptions
        this.options = Object.keys(this.customizable).join(`\n`).split(`\n`)
        let res = []
        for (let index = 0; index < this.options.length; index++) {
            const element = this.options[index]
            res.push({"name": `Hover for Details`,"value": `[${element}](${this.link} "[${index}] current value: ${this.bot[element]}\nOptions to change to are: ${this.valueOptions[element]}")`})
        }

        reply(`To update a value type the name of the varible or the number in the "[]"`,{
            columns: res
        })
        
        this.setSequence(3, 300000)
		this.sequence.on(`collect`, async msg => {
			const input = msg.content.toLowerCase()
			/**
			 * ---------------------
			 * Sequence Cancellations.
			 * ---------------------
			 */
			if (this.cancelParameters.includes(input)) {
				this.endSequence()
				return reply(this.locale.ACTION_CANCELLED)
			}
            
            /**
             * ---------------------
             * 2.) Check value against accepted values and confirm
             * ---------------------
             */
            if (this.onSequence == 2){
                let getOption = this.getAcceptedOption(this.varible, msg)
                if (getOption == `rejected`){
                    this.endSequence()
                    return reply(`Sorry but the selected value was rejected`)
                }
                this.endSequence()
                let metadata = {
                    config_code: this.varible,
                    guild: this.message.guild,
                    customized_parameter: getOption,
                    set_by_user_id: this.message.author.id,
                }
                db.setCustomConfig(metadata)
                return reply(`The value for ${this.varible} has been updated to ${getOption}`)
            }

			/**
             * ---------------------
             * 1.) Inputting varible name/index, and get selected varible
             * ---------------------
             */
            if (this.onSequence == 1) {
                let testIfNum = /^\d+$/.test(input)
                testIfNum ? this.varible = this.options[parseInt(input)] : this.varible = this.findElement(this.options, input)
                if (!this.varible) {
                    this.endSequence()
                    return reply(`Value inputed didn't match any avaible options.`)
                }
                this.nextSequence()
                reply(`Please supply what you would like the value to change ${this.varible} to`)
            }


        })
        
    }

    getAcceptedOption(varible, msg){
        let option = this.valueOptions[varible]
        let testValue = msg.content
        if ( option == `true/false`){
            let acceptedOptions = [`true`, `false`]
            if (acceptedOptions.includes(testValue.toLowerCase())) {
                return testValue.toLowerCase()
            } else {
                return `rejected`
            }
        } else if (option == `channel id, name, or link like #general`) {
            let channel
            try {
                channel =  msg.mentions.channels.first().id ||  msg.guild.channels.get(msg.content).id || msg.guild.channels.find(channel => channel.name === testValue.toLowerCase()).id
            } catch (error) {
                channel = null
            }
            if (channel) return channel
            if (!channel) return `rejected`
            /* try {
                channel = msg.guild.channels.get(msg.content).id
            } catch (error) {
                channel = null
            }
            if (channel) return channel
            try {
                channel = msg.guild.channels.find(channel => channel.name === testValue.toLowerCase()).id
            } catch (error) {
                return `rejected`
            } */
            return channel
        } else if (option == `any prefix you would like the bot to use`){
            return testValue
        } else {
            return `rejected`
        }
    }

    findElement(arr, propName) {
        for (var i=0; i < arr.length; i++){
          if (arr[i].toLowerCase() == [propName]) return arr[i]
        }
        return null
    }
    /**
     * deletes elements from object that user shouldn't be able to change
     * @returns nothing
     */
    get customizableOptions(){
        for (let index = 0; index < this.notCustomizable.length; index++) {
            delete this.customizable[this.notCustomizable[index]]
        }
        let options = Object.keys(this.customizable).join(`\n`).split(`\n`)
        for (let index = 0; index < options.length; index++) {
            if (options[index].includes(`modmail`))  delete this.customizable[options[index]]
        }
        return null
    }

}

module.exports.help = {
    start: Config,
    name: `config`,
    aliases: [],
    description: `Manage your settings for your server for the bot`,
    usage: `config <setting>`,
    group: `Manager`,
    permissionLevel: 3,
    multiUser: false
}

