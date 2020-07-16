const {heartReactionHandler} = require(`../struct/posts/likesHandler.js`)
//const BoosterColor = require(`../utils/BoosterColorManager`)
//const ClassroomManager = require(`../utils/ClassroomManager`)

module.exports = async(Components) => {
    
    //  Handling empty reactions
    if (!Components.reaction) return

    await Components.annie.updateConfig(Components.reaction.message.guild.id)
    
    Components.reactor = await Components.annie.fetchUser(Components.user.id)
    
    return new heartReactionHandler(Components).add()

    //  Extracting required vars for BoosterPerk check
    let messageID = Components.reaction.message.id
    let isBoosterPerkMessage = (messageID === `634414837426028584`) || (messageID === `634414682245169182`)
    //let isClassroomGuideMessage = (messageID === `634694103438983169`) && (Components.reaction.emoji.name === `✏`)

    if (isBoosterPerkMessage) new BoosterColor(Components).Add()
    //if (isClassroomGuideMessage) new ClassroomManager(Components).Add()
}