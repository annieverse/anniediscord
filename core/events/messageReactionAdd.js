const Heart = require(`../utils/artFeaturingManager`)
const BoosterColor = require(`../utils/BoosterColorManager`)
const ClassroomManager = require(`../utils/ClassroommManager`)

module.exports = async(Components) => {

    new Heart(Components).Add()

     //  Handling empty reactions
    if (!Components.reaction) return

    //  Extracting required vars for BoosterPerk check
    let messageID = Components.reaction.message.id
    let isBoosterPerkMessage = (messageID === `634414837426028584`) || (messageID === `634414682245169182`)
    let isClassroomGuideMessage = (messageID === `634694103438983169`) && (Components.reaction.emoji.name === `✏`)

    if (isBoosterPerkMessage) new BoosterColor(Components).Add()
    if (isClassroomGuideMessage) new ClassroomManager(Components).Add()
}