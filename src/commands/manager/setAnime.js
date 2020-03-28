const Command = require(`../../libs/commands`)
/**
 * Register user's MAL/Kitsu account link.
 * Revised by klerikdust.
 * @author sunnyrainyworks
 */
class SetAnime extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.source = [
            {name: `MAL`, ref: `https://myanimelist.net/profile/`},
            {name: `Kitsu`, ref: `https://kitsu.io/users/`}
        ]
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, bot:{db, supportServer, locale:{SETANIME}} }) {
        await this.requestUserMetadata(1)

        //  Display missing argument if user doesn't provide any argument
        if (!this.args[0]) return reply(SETANIME.MISSING_ARG, {color: `red`})
        //  Handle if user's provided url is not supported
        const getSource = this.source.filter(source => this.args[0].startsWith(source.ref))
        if (!getSource.length) return reply(SETANIME.SOURCE_UNSUPPORTED, {
            socket: [supportServer],
            color: `red`
        })

        await db.setUserSocialMedia(getSource[0].name, this.args[0], this.user.id)
        return reply(SETANIME.SUCCESSFUL, {socket: [getSource[0].name], color: `lightgreen`})
    }

}

module.exports.help = {
    start: SetAnime,
    name: `setAnime`,
    aliases: [`linkanime`, `setanime`, `registeranime`, `connectanime`],
    description: `Register user's MAL/Kitsu account link.`,
    usage: `setanime <MAL/KitsuAccountUrl>`,
    group: `Manager`,
    permissionLevel: 0,
    multiUser: false
}

