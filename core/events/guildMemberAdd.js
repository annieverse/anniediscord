const Banner = require(`../utils/welcomeBannerUI`)

module.exports = async (bot, member) => {
	/*
            * @guildMemberAdd listener.
            * it will send canvas-generated message to welcome channel
            * for every joined user.
    */
    new Banner({bot:bot, member:member, channel:`459891664182312982`}).render()
    
    //	Register new data if its a new user, else ignore.
    await bot.db.validatingNewUser(member.user.id)

    // Add Pencilician role
    member.addRole(`460826503819558914`)
    // Add unverified role 
    member.addRole(`588663266805415936`)

}
