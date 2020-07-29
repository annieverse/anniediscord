const {heartReactionHandler} = require(`../struct/posts/likesHandler.js`)
const BoosterColor = require(`../libs/nitroColorManager`)
//const ClassroomManager = require(`../utils/ClassroomManager`)

module.exports = async(Components) => {

    //  Handling empty reactions
    if (!Components.reaction) return
    await Components.annie.updateConfig(Components.reaction.message.guild.id)
    
    Components.reactor = await Components.annie.fetchUser(Components.user.id)
    
    new heartReactionHandler(Components).remove()
    
    let metadata = {
        bot: Components.annie, 
        reaction: Components.reaction, 
        user: Components.user
    }

    if (!Components.annie.booster_color_messages) return
    if (Components.annie.booster_color_messages.length < 1) return

    let isBoosterPerkMessage = Components.annie.booster_color_messages.includes(Components.reaction.message.id)
    if (isBoosterPerkMessage) new BoosterColor(metadata).remove()


    //  Extracting required vars for BoosterPerk check
    //let messageID = Components.reaction.message.id
    //let isBoosterPerkMessage = (messageID === `634414837426028584`) || (messageID === `634414682245169182`)
    //let isClassroomGuideMessage = (messageID === `634694103438983169`) && (Components.reaction.emoji.name === `✏`)

    //if (isBoosterPerkMessage) new BoosterColor(Components).Remove()
    //if (isClassroomGuideMessage) new ClassroomManager(Components).Remove()
}