`use-strict`

let Controller = require(`./MessageController`)
const Notification = require(`./notificationHandler`)
const dmOptions = require(`../utils/dmConfig/options`)

/**
 *  Handle interaction between user in dm interface.
 *  Inherited from Notification 
 *  @dmInterface
 */
class dmInterface extends Controller {
    constructor(data) {
        super(data)
        this.actionId = `dmconfig:${this.message.author.id}`
    }


    async run() {
    
        //  Get user options parameter
        const params = (this.message.content.toLowerCase()).split(` `)
    
        //  Returns if parameter is too short
        if (params.length < 1) return
    
        //  Returns if parent option is not available
        if (!dmOptions[params[0]]) return this.reply(this.code.DM.UNAVAILABLE_OPTION, {field: this.meta.author})
    
        //  Returns if sub option is not available
        if (!dmOptions[params[0]].includes(params[1])) return this.reply(this.code.DM.UNAVAILABLE_OPTION, {field: this.meta.author})
    
        //  Returns if user has recently make changes
        if (await this.keyv.get(this.actionId)) return this.reply(this.code.DM.COOLING_DOWN, {field: this.meta.author})
    
        //  Store recent changes to avoid database lock. Restored in 5 seconds.
        this.keyv.set(this.actionId, `1`, 5000)
    
        //  Run configuration
        return new Notification(this.data)[params[0]]()
    }

}


module.exports = dmInterface

