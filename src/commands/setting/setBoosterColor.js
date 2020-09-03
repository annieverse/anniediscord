const Command = require(`../../libs/commands`)
/**
 * Edit and customize booster roles in your guild.
 * @author Pan
 */
class SetBoosterColor extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.actions = [`edit`, `add`, `remove`, `setup`,`reset`]
        this.varible = `booster_colors`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute() {
        this.defaultColors = (JSON.stringify(this.bot.booster_colors)).substring(1,(JSON.stringify(this.bot.booster_colors).length - 1))
        //  Handle if user specifies the target item to be edit

        switch (this.args[0]) {
            case this.actions[0]:
                this.editObject(...arguments)
                break
            case this.actions[1]:
                this.addObject(...arguments)
                break
            case this.actions[2]:
                this.removeObject(...arguments)
                break
            case this.actions[3]:
                this.setup(...arguments)
                break
            case this.actions[4]:
                this.resetOptions(...arguments)
                break
            default:
                this.defaultOption(...arguments)
                break
        }
        
        

        
    }

    addObject({reply, bot:{db}}){
        if (this.bot.booster_colors.length == 0) return reply(`You do not have any colors set up, please use **setup** option to start using custom colors`)
        let role, emoji_id, emoji_name
        let colors = this.bot.booster_colors
        reply(`To add a color please enter in this format: <role id> <emoji id> <emoji name>734206698503405599 485994821824282624 RUN`)
        this.setSequence(5)
        this.sequence.on(`collect`, async msg =>{
            let input = msg.content.toLowerCase()
            let parameters = input.split(` `)
            /** 
             * --------------------
             *  Sequence Cancellations
             *  --------------------
             */
            if (this.cancelParameters.includes(input)) {
                reply(this.locale.ACTION_CANCELLED)
                return this.endSequence()
            }

            /**
             * Construct the object and repeat until finished
             */
            if (this.onSequence >= 1){
                role = this.getRole(parameters[0], msg)
                if (role == `rejected`) {
                    reply(`The provided input did not follow the format specified`)
                    return this.endSequence()
                }
                emoji_id = parameters[1]
                emoji_name = parameters.slice(2).join(` `)
                let newObj = {
                    "EMOJI_ID": emoji_id,
                    "EMOJI_NAME": emoji_name,
                    "ROLE": role
                }

                if (this.containsObject(newObj.ROLE, colors, `ROLE`) || this.containsObject(newObj.EMOJI_ID, colors, `EMOJI_ID`) || this.containsObject(newObj.EMOJI_NAME, colors, `EMOJI_NAME`)){
                    if (this.onSequence == 5){
                        return reply(`Attempts reached, this transaction will now end`)
                    }
                    reply(`That role/level is already assigned to a rank, please try again`)
                    return this.nextSequence() 
                }

                colors.push(newObj)
  
                colors.sort(function(a,b){return a.LEVEL - b.LEVEL})

                let option = JSON.stringify(colors)
                let metadata = {
                    config_code: this.varible,
                    guild: this.message.guild,
                    customized_parameter: option,
                    set_by_user_id: this.message.author.id,
                }
                db.setCustomConfig(metadata)
                reply(`All your colors have been added.`)
                return this.endSequence()
            }
        })
    }
    
    removeObject({reply, bot:{db}}){
        if (this.bot.booster_colors.length == 0) return reply(`You do not have any colors set up, please use **setup** option to start using custom colors`)
        let item, metadata, option
        let colors = this.bot.booster_colors
        reply(`Please supply the color you would like to edit by the role id, emoji id`)
        this.setSequence(5)
        this.sequence.on(`collect`, async msg =>{
            let input = msg.content.toLowerCase()
            /** 
             * --------------------
             *  Sequence Cancellations
             *  --------------------
             */
            if (this.cancelParameters.includes(input)) {
                reply(this.locale.ACTION_CANCELLED)
                return this.endSequence()
            }

            /**
             * Select the parameter to edit
             */
            if (this.onSequence == 2){
                switch (input) {
                    case `y`:
                        colors.indexOf(item[0]) > -1 ? colors.splice(colors.indexOf(item[0]), 1) : false
                        option = JSON.stringify(colors)
                        metadata = {
                            config_code: this.varible,
                            guild: this.message.guild,
                            customized_parameter: option,
                            set_by_user_id: this.message.author.id,
                        }
                        db.setCustomConfig(metadata)
                        this.endSequence()
                        break
                
                    default:
                        break
                }
            }

            /**
             * Get the item by role or 
             */
            if (this.onSequence == 1){
                let role = this.getRole(input, msg)
                if (role == `rejected`) {
                    item = null
                } else {
                    try {
                        item = this.bot.booster_colors.filter(i => i.ROLE == role)
                    } catch (error) {
                        item = null
                    }
                }
                if (!item){
                    reply(`No color matched what you entered`)
                    return this.endSequence()
                }
                try {
                    item = this.bot.booster_colors.filter(i => i.EMOJI_ID == input)
                } catch (error) {
                    reply(`No color matched what you entered`)
                    return this.endSequence()
                }
                reply(`Now supply ether emoji id, emoji name or role to edit by typing **id**, **name** or **role**`)
                this.nextSequence()
            }
            

        })
    }
    
    editObject({reply, bot:{db}}){
        if (this.bot.booster_colors.length == 0) return reply(`You do not have any colors set up, please use **setup** option to start using custom colors`)
        let parm, item, option, metadata, role, emoji_id, emoji_name, options
        reply(`Please supply the color you would like to edit by the role id, emoji id`)
        this.setSequence(20)
        this.sequence.on(`collect`, async msg =>{
            let input = msg.content.toLowerCase()
            /** 
             * --------------------
             *  Sequence Cancellations
             *  --------------------
             */
            if (this.cancelParameters.includes(input)) {
                reply(this.locale.ACTION_CANCELLED)
                return this.endSequence()
            }

            /**
             * update the item
             */
            if (this.onSequence == 3){
                switch (parm) {
                    case `EMOJI`:
                        options = input.split(` `)
                        if (!options[0] && !options[1]) {
                            reply(`The provided input did not follow the format specified`)
                            return this.endSequence()
                        }
                        if (!item || item == undefined) return this.endSequence()
                        if (!parm || parm == undefined) return this.endSequence()
                        
                        emoji_id = options[0]
                        emoji_name = options.slice(1).join(` `)

                        if (this.containsObject(emoji_id, this.bot.booster_colors, `EMOJI_ID`)){
                            reply(`That id is already assigned to a color`)
                            return this.endSequence() 
                        }
                        if (this.containsObject(emoji_name, this.bot.booster_colors, `EMOJI_NAME`)){
                            reply(`That name is already assigned to a color`)
                            return this.endSequence() 
                        }
                        reply(`Your selected color has been updated`)
                        this.bot.booster_colors.forEach(element => {
                            if (element.ROLE == item[0].ROLE){
                                element.EMOJI_ID = emoji_id
                                element.EMOJI_NAME = emoji_name
                            }
                        })
                        
                        this.bot.booster_colors.sort(function(a,b){return a.LEVEL - b.LEVEL})
                        option = JSON.stringify(this.bot.booster_colors)
                        metadata = {
                            config_code: this.varible,
                            guild: this.message.guild,
                            customized_parameter: option,
                            set_by_user_id: this.message.author.id,
                        }
                        db.setCustomConfig(metadata)
                        this.endSequence()
                        break
                    case `ROLE`:
                        role = this.getRole(input, msg)
                        if (role == `rejected`) {
                            reply(`The provided input did not follow the format specified`)
                            return this.endSequence()
                        }
                        if (!item || item == undefined) return this.endSequence()
                        if (!parm|| parm == undefined) return this.endSequence()
                        if (!role|| role == undefined) return this.endSequence()

                        if (this.containsObject(role, this.bot.booster_colors, `ROLE`)){
                            reply(`That role is already assigned to a rank`)
                            return this.endSequence() 
                        }
                        
                        reply(`Your selected rank has been updated`)
                        this.bot.booster_colors.forEach(element => {
                            if (element.EMOJI_ID == item[0].EMOJI_ID){
                                element.ROLE = role
                            }
                        })
                        
                        option = JSON.stringify(this.bot.booster_colors)
                        metadata = {
                            config_code: this.varible,
                            guild: this.message.guild,
                            customized_parameter: option,
                            set_by_user_id: this.message.author.id,
                        }
                        db.setCustomConfig(metadata)
                        this.endSequence()
                        break
                }
            }

            /**
             * Select the parameter to edit
             */
            if (this.onSequence == 2){
                switch (input) {
                    case `emoji`:
                        parm = `EMOJI`
                        reply(`Now supply the id, followed by the name you wish the value to be`)
                        this.nextSequence()
                        break
                    case `role`:
                        parm = `ROLE`
                        reply(`Now supply the rank you wish the value to be by id, name or mention`)
                        this.nextSequence()
                        break
                    default:
                        reply(`The provided input did not follow the format specified`)
                        this.endSequence()
                        break
                }
            }

            /**
             * Get the item by role or 
             */
            if (this.onSequence == 1){
                let role = this.getRole(input, msg)
                if (role == `rejected`) {
                    item = null
                } else {
                    try {
                        item = this.bot.booster_colors.filter(i => i.ROLE == role)
                    } catch (error) {
                        item = null
                    }
                }
                if (!item){
                    reply(`No color matched what you entered`)
                    return this.endSequence()
                }
                try {
                    item = this.bot.booster_colors.filter(i => i.EMOJI_ID == input)
                } catch (error) {
                    reply(`No color matched what you entered`)
                    return this.endSequence()
                }
                reply(`Now supply ether emoji id, emoji name or role to edit by typing **id**, **name** or **role**`)
                this.nextSequence()
            }
            

        })
    }

    containsObject(obj, list, parm) {
        var x
        for (x in list) {
            switch (parm) {
                case `ROLE`:
                    if (Object.prototype.hasOwnProperty.call(list,x) && list[x].ROLE === obj) {
                        return true
                    }
                    break
                case `EMOJI_NAME`:
                    if (Object.prototype.hasOwnProperty.call(list,x) && list[x].EMOJI_NAME === obj) {
                        return true
                    }
                    break
                    
                case `EMOJI_ID`:
                    if (Object.prototype.hasOwnProperty.call(list,x) && list[x].EMOJI_ID === obj) {
                        return true
                    }
                    break
            
                default:
                    if (Object.prototype.hasOwnProperty.call(list,x) && list[x] === obj) {
                        return true
                    }
                    break
            }
            
        }
    
        return false
    }
    setup({reply, bot:{db}}){
        let amount_of_colors, role, emoji_id, emoji_name
        let newColors = []
        reply(`How many color options would you like. For example, 5 colors, 10 colors etc. 22 is the max.`)
        this.setSequence(25)
        this.sequence.on(`collect`, async msg =>{
            let input = msg.content.toLowerCase()
            let parameters = input.split(` `)
            /** 
             * --------------------
             *  Sequence Cancellations
             *  --------------------
             */
            if (this.cancelParameters.includes(input)) {
                reply(this.locale.ACTION_CANCELLED)
                return this.endSequence()
            }

            /**
             * Construct the object and repeat until finished
             */
            if (this.onSequence >= 2){

                if (input == `finished`){
                    if (newColors < 1) return this.endSequence()
                    let option = JSON.stringify(newColors)

                    let metadata = {
                        config_code: this.varible,
                        guild: this.message.guild,
                        customized_parameter: option,
                        set_by_user_id: this.message.author.id,
                    }
                    db.setCustomConfig(metadata)
                    reply(`All your colors have been added.`)
                    return this.endSequence()
                }
                role = this.getRole(parameters[0], msg)
                if (role == `rejected`) {
                    reply(`The provided input did not follow the format specified`)
                    return this.endSequence()
                }

                if (!parameters[1]) {
                    reply(`The provided input did not follow the format specified`)
                    return this.endSequence()
                }
                
                emoji_id = parameters[1]
                emoji_name = parameters.slice(2).join(` `)
                let newObj = {
                    "EMOJI_ID": emoji_id,
                    "EMOJI_NAME": emoji_name,
                    "ROLE": role
                }

                if (this.containsObject(newObj.ROLE, newColors, `ROLE`) || this.containsObject(newObj.EMOJI_ID, newColors, `EMOJI_ID`) || this.containsObject(newObj.EMOJI_NAME, newColors, `EMOJI_NAME`)){
                    reply(`That role/level is already assigned to a rank, please try again`)
                    return this.nextSequence() 
                }

                newColors.push(newObj)

                if (newColors.length == amount_of_colors) {
                    
                    newColors.sort(function(a,b){return a.LEVEL - b.LEVEL})
                    let option = JSON.stringify(newColors)
                    let metadata = {
                        config_code: this.varible,
                        guild: this.message.guild,
                        customized_parameter: option,
                        set_by_user_id: this.message.author.id,
                    }
                    db.setCustomConfig(metadata)
                    reply(`All your colors have been added.`)
                    return this.endSequence()
                }
                reply(`Okay continue adding following the same format. If you wish to end here and save type **finished**`)
                this.nextSequence()
            }

            /**
             * Test the amount of colors and continue
             * test if input is an integer, then correct negative values and maximum value
             */
            if (this.onSequence == 1){
                let num
                try {
                    num = parseInt(input)
                } catch (error) {
                    reply(`The provided input was not an integer`)
                    return this.endSequence()
                }
                if (num > 22) num = 22
                if (num < 1) num = 1
                amount_of_colors = num
                reply(`Okay the amount of colors you want is ${amount_of_colors}, Now give the role id or mention, emoji id, emoji name you would like to add.\n in this format: 734206698503405599 485994821824282624 RUN`)
                this.nextSequence()
            }

        })
    }

    getRole(roleTest, msg){
        let role
        try {
            role =  msg.mentions.roles.first().id
        } catch (error) {
            role = null
        }
        if (role) return role
        try {
            role = msg.guild.roles.cache.get(roleTest).id
        } catch (error) {
            role = null
        }
        if (role) return role
        try {
            role = msg.guild.roles.find(r => r.name === roleTest.toLowerCase()).id
        } catch (error) {
            return `rejected`
        } 
        return role
    }

    resetOptions({reply, bot:{db}}){
        if (this.bot.booster_colors.length == 0) return reply(`You do not have any colors set up, please use **setup** option to start using custom colors`)
        reply(`Are you sure you want to reset the colors? y or n`)
        this.setSequence(4)
        this.sequence.on(`collect`, async msg => {
            let input = msg.content.toLowerCase()
            /** 
             * --------------------
             *  Sequence Cancellations
             *  --------------------
             */
            if (this.cancelParameters.includes(input)) {
                reply(this.locale.ACTION_CANCELLED)
                return this.endSequence()
            }

            if (input == `y`){
                let metadata = {
                    config_code: this.varible,
                    guild: this.message.guild,
                    customized_parameter: `[]`,
                    set_by_user_id: this.message.author.id,
                }
                db.setCustomConfig(metadata)
                reply(`Okay reset finished`)
                return this.endSequence()
            } else {
                reply(`Okay reset aborted`)
                return this.endSequence()
            }

        })
    }

    defaultOption({reply}){
        // Handle if user doesn't specify the target item to be edit
        this.bot.booster_colors.length == 0 ? reply(`Your current options consist of the following: ${this.defaultColors}`) 
        : reply(`Currently no colors have been set up, please run setup`)

        reply(`To edit an existing value type **edit**, to reset type **reset**, to setup type **setup**, to add a value type **add**, and to remove a value type **remove**`)

        this.setSequence(4)
        this.sequence.on(`collect`, async msg => {
            let input = msg.content.toLowerCase()
            /** 
             * --------------------
             *  Sequence Cancellations
             *  --------------------
             */
            if (this.cancelParameters.includes(input)) {
                reply(this.locale.ACTION_CANCELLED)
                return this.endSequence()
            }
            
            switch (input) {
                case this.actions[0]:
                    this.endSequence()
                    this.editObject(...arguments)
                    break
                case this.actions[1]:
                    this.endSequence()
                    this.addObject(...arguments)
                    break
                case this.actions[2]:
                    this.endSequence()
                    this.removeObject(...arguments)
                    break
                case this.actions[3]:
                    this.endSequence()
                    this.setup(...arguments)
                    break
                case this.actions[4]:
                    this.endSequence()
                    this.resetOptions(...arguments)
                    break
                default:
                    this.endSequence()
                    break
            }
        })
    }
}


module.exports.help = {
    start: SetBoosterColor,
    name: `setBoosterColor`, 
    aliases: [`setboostercolor`], 
    description: `Edit and customize booster roles in your guild`,
    usage: `setboostercolor`,
    group: `Setting`,
    permissionLevel: 3,
    multiUser: false
}