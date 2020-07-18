const Command = require(`../../libs/commands`)
/**
 * Manage custom configs per sever
 * @author Pan
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
            res.push({"name": `Hover for Details`,"value": `[${element}](${this.link} "[${index}] current value: ${JSON.stringify(this.bot[element])}\nOptions to change to are: ${JSON.stringify(this.valueOptions[element])}")`})
        }

        reply(`To update a value type the name of the varible or the number in the "[]"`,{
            columns: res
        })
        
        this.setSequence(4, 300000)
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
                    reply(`Sorry but the selected value was rejected`)
                    return this.endSequence()
                }
                if (getOption == `none to remove`){
                    reply(`Sorry but the selected value was rejected due to not existing yet`)
                    return this.endSequence()
                }
                
                let metadata = {
                    config_code: this.varible,
                    guild: this.message.guild,
                    customized_parameter: getOption,
                    set_by_user_id: this.message.author.id,
                }
                // test to see if guild is in guild table and if not add it
                db.setCustomConfig(metadata)
                reply(`The value for ${this.varible} has been updated to ${getOption}`)
                return this.endSequence()
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
                let welcomeText = this.varible == `welcome_text`
                let setRanks = this.varible == `set_ranks`
                if (welcomeText) reply(`Please supply what you would like the value to change [${this.varible}](${this.link} "Use {{guild}} to display guild name and {{user}} to display the user's tag") to. To reset setting type reset.`)
                if (setRanks) {
                    this.endSequence()
                    return reply(`Please use ${this.prefix}setranks to modify this setting`)
                }
                reply(`Please supply what you would like the value to change ${this.varible} to. To reset setting type reset.`)
            }


        })
        
    }

    getAcceptedOption(varible, msg){
        let option = this.valueOptions[varible]
        let testValue = msg.content
        let resetVarible = this.customizable
        if (testValue.toLowerCase() == `reset`) return resetVarible[varible]
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
                channel =  msg.mentions.channels.first().id
            } catch (error) {
                channel = null
            }
            if (channel) return channel
             try {
                channel = msg.guild.channels.get(msg.content).id
            } catch (error) {
                channel = null
            }
            if (channel) return channel
            try {
                channel = msg.guild.channels.find(channel => channel.name === testValue.toLowerCase()).id
            } catch (error) {
                return `rejected`
            } 
            return channel
        } else if (option == `any prefix you would like the bot to use` || option == `text`){
            return testValue
        } else if (option == `role id, name, or @ like @admin`) {
            let role
            try {
                role =  msg.mentions.roles.first().id
            } catch (error) {
                role = null
            }
            if (role) return role
                try {
                role = msg.guild.roles.get(msg.content).id
            } catch (error) {
                role = null
            }
            if (role) return role
            try {
                role = msg.guild.roles.find(r => r.name === testValue.toLowerCase()).id
            } catch (error) {
                return `rejected`
            } 
            return role
        } else if (option == `a - (to remove) or + (to add) followed by role id, or @ like @admin would look like + 723968269496615014`){
            let existingRoles = this.bot[varible]
            let str = ``
            str += existingRoles
            existingRoles = str.split(`, `)
            existingRoles = this.removeItemAll(existingRoles, ``)
            if (testValue[0] == `-`){
                if (existingRoles.length == 0) return `none to remove`
                let role = this.getRole(msg, testValue)
                if (role == `rejected`) return `none to remove`
                let array = this.removeItemAll(existingRoles, role)
                array.length == 0 ? array = `` : array = array.join(`, `)
                return array
                
            } else if (testValue[0] == `+`){
                let role = this.getRole(msg, testValue)
                if (role == `rejected`) return `none to remove`
                existingRoles.push(role)
                existingRoles = existingRoles.reduce((unique, item) => {
                    return unique.includes(item) ? unique : [...unique, item]
                }, [])
                existingRoles = this.removeItemAll(existingRoles, ``)
                existingRoles = existingRoles.join(`, `)
                return existingRoles
            } else {
                return `rejected`
            }
        } else if (option == `number`){
            let test
            try {
                test = parseInt(testValue)
            } catch (error) {
                test = 10
            }
            return test
        }else if (option == `object like {"LEVEL": "number", "ROLE": "role id, name, or @ like @admin"}`){
            return `rejected`
        }else {
            return `rejected`
        }
    }
    removeItemAll(arr, value) {
        var i = 0
        while (i < arr.length) {
          if (arr[i].trim() === value) {
            arr.splice(i, 1)
          } else {
            ++i
          }
        }
        return arr
    }
    getRole(msg, testValue){
        let role
        try {
            role =  msg.mentions.roles.first().id
        } catch (error) {
            role = null
        }
        if (role) return role
            try {
            role = msg.guild.roles.get(testValue.substring(2)).id
        } catch (error) {
            return `rejected`
        }
        return role
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

