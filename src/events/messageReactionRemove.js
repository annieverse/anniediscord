//const {heartReactionHandler} = require(`../struct/posts/likesHandler.js`)
//const BoosterColor = require(`../libs/nitroColorManager`)

module.exports = async ( /*Components, configs*/ ) => {
    /**
     * Update once configs are updated
     
    Components[`configs`] = configs
    //  Handling empty reactions
    if (!Components.reaction) return
    
    Components.reactor = await Components.annie.users.fetch(Components.user.id)
    
    new heartReactionHandler(Components).remove()
    
    let metadata = {
        bot: Components.annie, 
        reaction: Components.reaction, 
        user: Components.user
    }

    if (!configs.get(`BOOSTER_COLORS_MESSAGES`).value) return 
    if (configs.get(`BOOSTER_COLORS_MESSAGES`).value.length < 1) return

    let isBoosterPerkMessage = configs.get(`BOOSTER_COLORS_MESSAGES`).value.includes(Components.reaction.message.id)
    if (isBoosterPerkMessage) new BoosterColor(metadata).remove()
    */
}