const Command = require(`../../libs/commands`)
/**
 * Edit and customize role-ranking system in your guild.
 * @author Pan
 */
class SetRanks extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.actions = [`edit`, `add`, `remove`, `setup`,`reset`]
        this.varible = `set_ranks`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute() {
        this.defaultRanks = (JSON.stringify(this.bot.set_ranks)).substring(1,(JSON.stringify(this.bot.set_ranks).length - 1))
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
        if (this.bot.set_ranks.length == 0) return reply(`You are using the default ranks, please use **setup** option to start using custom roles`)
        let role, level
        let ranks = this.bot.set_ranks
        reply(`To add a rank please enter in this format: <num> <role by id or mention>\n This would look like this: 0 460826503819558914`)
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

                let num
                try {
                    num = parseInt(parameters[0])
                } catch (error) {
                    reply(`The provided input did not follow the format specified`)
                    return this.endSequence()
                }
                if (num < 0) num = 0
                
                level = num
                role = this.getRole(parameters.slice(1).join(` `), msg)
                if (role == `rejected`) {
                    reply(`The provided input did not follow the format specified`)
                    return this.endSequence()
                }

                let newObj = {
                    "LEVEL": level,
                    "ROLE": role
                }

                if (this.containsObject(newObj.ROLE, ranks, `ROLE`) || this.containsObject(newObj.LEVEL, ranks, `LEVEL`)){
                    reply(`That role/level is already assigned to a rank, please try again`)
                    return this.nextSequence() 
                }

                ranks.push(newObj)
  
                ranks.sort(function(a,b){return a.LEVEL - b.LEVEL})

                let option = JSON.stringify(ranks)
                let metadata = {
                    config_code: this.varible,
                    guild: this.message.guild,
                    customized_parameter: option,
                    set_by_user_id: this.message.author.id,
                }
                db.setCustomConfig(metadata)
                reply(`All your ranks have been added.`)
                return this.endSequence()
            }
        })
    }
    
    removeObject({reply, bot:{db}}){
        if (this.bot.set_ranks.length == 0) return reply(`You are using the default ranks, please use **setup** option to start using custom roles`)
        let item, metadata, option
        let ranks = this.bot.set_ranks
        reply(`Please supply the rank you would like to edit by the level or rank`)
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
                        ranks.indexOf(item[0]) > -1 ? ranks.splice(ranks.indexOf(item[0]), 1) : false
                        option = JSON.stringify(ranks)
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
                try {
                    item = ranks.filter(i => i.LEVEL == parseInt(input))
                } catch (error) {
                    item = null
                }
                if (item && item.length > 0) {
                    reply(`Are you sure you want to remove this rank level pair. y or n`)
                    return this.nextSequence()
                }
                let role = this.getRole(input, msg)
                if (role == `rejected`) {
                    item = null
                } else {
                    try {
                        item = ranks.filter(i => i.ROLE == role)
                    } catch (error) {
                        item = null
                    }
                }
                if (!item){
                    reply(`No rank matched what you enter`)
                    return this.endSequence()
                }
                reply(`Are you sure you want to remove this rank level pair. y or n`)
                this.nextSequence()
            }
            

        })
    }
    
    editObject({reply, bot:{db}}){
        if (this.bot.set_ranks.length == 0) return reply(`You are using the default ranks, please use **setup** option to start using custom roles`)
        let parm, item, option, metadata, role, num
        reply(`Please supply the rank you would like to edit by the level or rank`)
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
                    case `LEVEL`:
                        try {
                            num = parseInt(input)
                        } catch (error) {
                            reply(`The provided input did not follow the format specified`)
                            return this.endSequence()
                        }
                        
                        if (!item || item == undefined) return this.endSequence()
                        if (!parm || parm == undefined) return this.endSequence()
                        
                        if (this.containsObject(num, this.bot.set_ranks, `LEVEL`)){
                            reply(`That level is already assigned to a rank`)
                            return this.endSequence() 
                        }
                        
                        reply(`Your selected rank has been updated`)
                        this.bot.set_ranks.forEach(element => {
                            if (element.ROLE == item[0].ROLE){
                                element.LEVEL = num
                            }
                        })
                        
                        this.bot.set_ranks.sort(function(a,b){return a.LEVEL - b.LEVEL})
                        option = JSON.stringify(this.bot.set_ranks)
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

                        if (this.containsObject(role, this.bot.set_ranks, `ROLE`)){
                            reply(`That role is already assigned to a rank`)
                            return this.endSequence() 
                        }
                        
                        reply(`Your selected rank has been updated`)
                        this.bot.set_ranks.forEach(element => {
                            if (element.LEVEL == item[0].LEVEL){
                                element.ROLE = role
                            }
                        })
                        
                        option = JSON.stringify(this.bot.set_ranks)
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
                    case `level`:
                        parm = `LEVEL`
                        reply(`Now supply the level you wish the value to be`)
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
                try {
                    item = this.bot.set_ranks.filter(i => i.LEVEL == parseInt(input))
                } catch (error) {
                    item = null
                }
                if (item && item.length > 0) {
                    reply(`Now supply ether level or role to edit by typing **level** or **role**`)
                    return this.nextSequence()
                }
                let role = this.getRole(input, msg)
                if (role == `rejected`) {
                    item = null
                } else {
                    try {
                        item = this.bot.set_ranks.filter(i => i.ROLE == role)
                    } catch (error) {
                        item = null
                    }
                }
                if (!item){
                    reply(`No rank matched what you enter`)
                    return this.endSequence()
                }
                reply(`Now supply ether level or role to edit by typing **level** or **role**`)
                this.nextSequence()
            }
            

        })
    }

    containsObject(obj, list, parm) {
        var x
        for (x in list) {
            switch (parm) {
                case `LEVEL`:
                    if (Object.prototype.hasOwnProperty.call(list,x) && list[x].LEVEL === obj) {
                        return true
                    }
                    break
                case `ROLE`:
                    if (Object.prototype.hasOwnProperty.call(list,x) && list[x].ROLE === obj) {
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
        let amount_of_ranks, role, level
        let newRanks = []
        reply(`How many rank options would you like. For example, 5 ranks, 10 ranks etc. 16 is the max.`)
        this.setSequence(30)
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
                    if (newRanks < 1) return this.endSequence()
                    let option = JSON.stringify(newRanks)

                    let metadata = {
                        config_code: this.varible,
                        guild: this.message.guild,
                        customized_parameter: option,
                        set_by_user_id: this.message.author.id,
                    }
                    db.setCustomConfig(metadata)
                    reply(`All your ranks have been added.`)
                    return this.endSequence()
                }
                let num
                try {
                    num = parseInt(parameters[0])
                } catch (error) {
                    reply(`The provided input did not follow the format specified`)
                    return this.endSequence()
                }
                if (num < 0) num = 0
                
                level = num
                role = this.getRole(parameters.slice(1).join(` `), msg)
                if (role == `rejected`) {
                    reply(`The provided input did not follow the format specified`)
                    return this.endSequence()
                }

                let newObj = {
                    "LEVEL": level,
                    "ROLE": role
                }

                if (this.containsObject(newObj.ROLE, newRanks, `ROLE`) || this.containsObject(newObj.LEVEL, newRanks, `LEVEL`)){
                    reply(`That role/level is already assigned to a rank, please try again`)
                    return this.nextSequence() 
                }

                newRanks.push(newObj)

                if (newRanks.length == amount_of_ranks) {
                    
                    newRanks.sort(function(a,b){return a.LEVEL - b.LEVEL})
                    let option = JSON.stringify(newRanks)
                    let metadata = {
                        config_code: this.varible,
                        guild: this.message.guild,
                        customized_parameter: option,
                        set_by_user_id: this.message.author.id,
                    }
                    db.setCustomConfig(metadata)
                    reply(`All your ranks have been added.`)
                    return this.endSequence()
                }
                reply(`Okay continue adding following the same format. If you wish to end here and save type **finished**`)
                this.nextSequence()
            }

            /**
             * Test the amount of ranks and continue
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
                if (num > 16) num = 16
                if (num < 1) num = 1
                amount_of_ranks = num
                reply(`Okay the amount of ranks you want is ${amount_of_ranks}, Now give the level and role you would like to add.
                \n Please enter in this format: <num> <role by id or mention>\n This would look like this: 0 460826503819558914`)
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
            role = msg.guild.roles.get(roleTest).id
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
        if (this.bot.set_ranks.length == 0) return reply(`You are already using the default ranks, please use **setup** option to start using custom roles`)
        reply(`Are you sure you want to reset the ranks and use the default list? y or n`)
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
        this.bot.set_ranks.length == 0 ? reply(`Your current options consist of the following`) 
        : reply(`Currently no ranks roles have been set up so the default list is used and looks like this:\n ${this.defaultRanks}`)

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
    start: SetRanks,
    name: `setRanks`, 
    aliases: [`setranks`, `setrank`, `setRanks`], 
    description: `Edit and customize role-ranking system in your guild.`,
    usage: `setranks`,
    group: `Manager`,
    permissionLevel: 3,
    multiUser: false
}