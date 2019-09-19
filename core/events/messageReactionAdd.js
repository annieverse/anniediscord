const Heart = require(`../utils/artFeaturingManager`)

module.exports = async(Components) => {
    new Heart(Components).Add()
    classRoom()


    /**
     *
     *	This function can be wrapped into its own class.
     *	@classRoom
     */
    async function classRoom() {

        const { bot, reaction, user } = Components
        let classRoomChannel = bot.channels.get(`621705949429891074`)
        const rmsg = reaction.message;
        const member = await rmsg.guild.fetchMember(user);

        function getRoles(r) {
            const guild = bot.guilds.get(`459891664182312980`);
            const role = guild.roles.find(n => n.id === r);
            return role;
        }

        function getEmoji(e) {
            if (typeof e == "string") {
                return bot.emojis.find(emoji => emoji.name === e);
            } else {
                return e;
            }
        }

        const ApprenticeKey = `621714766947287052`
        const Announcements = `614737097454125056`

        //    Ignore message outside of #announcements channel.
        if (rmsg.channel.id != Announcements) return

        //    Ignore message if reaction is not a pencil.    
        if (reaction.emoji.name != `✏`) return

        //    Ignore if user already have the role.
        if (member.roles.find(x => x.id == ApprenticeKey)) return

        //    Assign key, send notification.
    	bot.logger.info(`${rmsg.author.tag} has received Apprenticeship Key.`)
        await member.addRole(ApprenticeKey);
        return classRoomChannel.send(`${rmsg.author} has joined the classroom!`)
    }
}