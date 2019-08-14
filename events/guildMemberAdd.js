const Banner = require(`../utils/welcomeBannerUI`)

module.exports = (bot, member) => {
    /*
            * @guildMemberAdd listener.
            * it will send canvas-generated message to welcome channel
            * for every joined user.
    */
    new Banner({bot, member, channel:`459891664182312982`}).render()

}
