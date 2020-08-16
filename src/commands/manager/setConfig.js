const Command = require(`../../libs/commands`)
/**
 * Manage custom configs for the current guild
 * @author Pan
 */
class SetConfig extends Command {

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
    async execute({reply, name, emoji, bot:{db}}) {
        await this.requestUserMetadata(1)
        this.customizableOptions
        this.options = Object.keys(this.customizable).join(`\n`).split(`\n`)
        let res = []
        for (let index = 0; index < this.options.length; index++) {
            const element = this.options[index]
            res.push({name: element,"value": `[${element}](${this.link} "[${index}] current value: ${JSON.stringify(this.bot[element])}\nOptions to change to are: ${JSON.stringify(this.valueOptions[element])}")`})
        }

        //  Handle if user doesn't include any parameter
        if (!this.fullArgs) {
            await reply(this.locale.CONFIGURATIONS.HEADER, {color: `crimson`, socket: {user: name(this.user.id), emoji: emoji(`AnnieWave`)}, columns: res})
            return reply(this.locale.CONFIGURATIONS.FOOTER_GUIDE, {color: `crimson`, socket: {prefix: this.bot.prefix}})
        }
 
        let testIfNum = /^\d+$/.test(this.fullArgs)
        testIfNum ? this.module = this.options[parseInt(this.fullArgs)] : this.module = this.findElement(this.options, this.fullArgs)

        //  Handle if the selected module doesn't exists.
        if (!this.module) return reply(this.locale.CONFIGURATIONS.INVALID_MODULE, {color: `red`})   
        //  Return if user attempting to manage booster color
        if (this.module === `booster_colors`) return reply(this.locale.CONFIGURATIONS.GUIDE_FOR_SETBOOSTERCOLORS, {color: `red`, socket:{prefix: this.prefix}})
        //  Return if user attempting to manage rank configurations
        if (this.module === `set_ranks`) return reply(this.locale.CONFIGURATIONS.GUIDE_FOR_SETRANKS, {color: `red`, socket:{prefix: this.prefix}})
        //  Display diff prompt if user attempting to manage welcomer text configurations.
        if (this.module === `welcome_text`) {
            reply(this.locale.CONFIGURATIONS.GUIDE_FOR_WELCOMETEXT, {color: `golden`, footer: this.locale.CONFIGURATIONS.GUIDE_FOR_WELCOMETEXT_FOOTER})
        }
        else {
            reply(this.locale.CONFIGURATIONS.CONFIRMATION, {color: `golden`, socket:{module: this.module}})
        }
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
             * Check value against accepted values and confirm.
             * ---------------------
             */
            if (this.onSequence == 1){
                let getOption = await this.getAcceptedOption(this.module, msg)
                if (getOption === `rejected`){
                    reply(this.locale.CONFIGURATIONS.REJECTED, {color: `red`})
                    return this.endSequence()
                }
                if (getOption === `none to remove`){
                    reply(this.locale.CONFIGURATIONS.NONE_TO_REMOVE, {color: `red`})
                    return this.endSequence()
                }
                if (getOption === `format`){
                    reply(this.locale.CONFIGURATIONS.WRONG_FORMAT, {color: `red`,socket:{"format":`\`+ <channel target>\` or \`- <channel target>\``}})
                    return this.endSequence()
                }
                let metadata = {
                    config_code: this.module,
                    guild: this.message.guild,
                    customized_parameter: getOption,
                    set_by_user_id: this.message.author.id,
                }
                // Test to see if guild is in guild table and if not add it
                db.setCustomConfig(metadata)
                reply (this.locale.CONFIGURATIONS.SUCCESSFUL, {color: `lightgreen`, socket:{module: this.module} })
                return this.endSequence()
            }
        })
        
    }

    async getAcceptedOption(varible, msg){
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
            let channel = this.getChannel(msg, testValue)
            return channel
        } else if (option == `any prefix you would like the bot to use` || option == `text`){
            return testValue
        } else if (option == `role id, name, or @ like @admin`) {
            let role = this.getRole(msg, testValue)
            return role
        } else if (option == `a - (to remove) or + (to add) followed by role id, or @ like @admin would look like + 723968269496615014`){
            let existingRoles = this.bot[varible]
            let str = ``
            str += existingRoles
            existingRoles = str.split(`, `)
            existingRoles = this.removeItemAll(existingRoles, ``)
            if (testValue[0] == `-`){
                if (existingRoles.length == 0) return `none to remove`
                let role = this.getRole(msg, testValue.substring(2))
                if (role == `rejected`) return `none to remove`
                let array = this.removeItemAll(existingRoles, role)
                array.length == 0 ? array = `` : array = array.join(`, `)
                return array
                
            } else if (testValue[0] == `+`){
                let role = this.getRole(msg, testValue.substring(2))
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
        } else if (option == `channel id followed by a - (to remove) or + (to add) followed by message id would look like 7239682694966435453 + 723968269496615014`){
            let options = testValue.split(` `)
            let channel = this.getChannel(msg, options[0])
            if (channel == `rejected`) return channel 
            channel = msg.guild.channels.get(channel)
            let existingMessages = this.bot[varible]
            let messageId
            let str = ``
            str += existingMessages
            existingMessages = str.split(`, `)
            existingMessages = this.removeItemAll(existingMessages, ``)
            if (options[1] == `-`){
                if (existingMessages.length == 0) return `none to remove`
                await channel.messages.fetch(options[2]).then(message => {
                    messageId = message.id
                }).catch(messageId = null)
                if (!messageId) return `rejected`
                let array = this.removeItemAll(existingMessages, messageId)
                array.length == 0 ? array = `` : array = array.join(`, `)
                return array
                
            } else if (options[1] == `+`){
                await channel.messages.fetch(options[2]).then(message => {
                    messageId = message.id
                }).catch(messageId = null)
                if (!messageId) return `rejected`
                existingMessages.push(messageId)
                existingMessages = existingMessages.reduce((unique, item) => {
                    return unique.includes(item) ? unique : [...unique, item]
                }, [])
                existingMessages = this.removeItemAll(existingMessages, ``)
                existingMessages = existingMessages.join(`, `)
                return existingMessages
            } else {
                return `rejected`
            }
        }else if (option == `a - (to remove) or + (to add) followed by channel id, or link like #general`){
            let options = testValue.split(` `)
            if (options.length < 2) return `format`
            let channel = this.getChannel(msg, options[1])
            if (channel == `rejected`) return channel 
            let existingChannels = this.bot[varible]
            let str = `` + existingChannels
            existingChannels = str.split(`, `)
            existingChannels = this.removeItemAll(existingChannels, ``)
            if (options[0] == `-`){
                if (existingChannels.length == 0) return `none to remove`
                let array = this.removeItemAll(existingChannels, channel)
                array.length == 0 ? array = `` : array = array.join(`, `)
                return array
            } else if (options[0] == `+`){
                existingChannels.push(channel)
                existingChannels = existingChannels.reduce((unique, item) => {
                    return unique.includes(item) ? unique : [...unique, item]
                }, [])
                existingChannels = this.removeItemAll(existingChannels, ``)
                existingChannels = existingChannels.join(`, `)
                return existingChannels
            } else {
                return `rejected`
            }
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
            role = msg.guild.roles.cache.get(testValue).id
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
    }

    getChannel(msg, testValue){
        let channel
            try {
                channel =  msg.mentions.channels.first().id
            } catch (error) {
                channel = null
            }
            if (channel) return channel
             try {
                channel = msg.guild.channels.get(testValue).id
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
    start: SetConfig,
    name: `setConfig`,
    aliases: [`setconfig`, `setconf`, `config`],
    description: `Manage custom configurations for the current guild`,
    usage: `setconfig <ModuleCode>`,
    group: `Manager`,
    permissionLevel: 3,
    multiUser: false
}

