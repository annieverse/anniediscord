const Command = require(`../../libs/commands`)
/**
 * Registering your social media account.
 * Revised by klerikdust.
 * @author sunnyrainyworks
 */
class SetSocialMedia extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.source = [
            {name: `MAL/Kitsu`, ref: `https://myanimelist.net/profile/`},
            {name: `MAL/Kitsu`, ref: `https://kitsu.io/users/`},
            {name: `Facebook`, ref: `facebook.com/`},
            {name: `Twitter`, ref: `twitter.com/`},
            {name: `Instagram`, ref: `instagram.com/`},
            {name: `DeviantArt`, ref: `deviantart.com/`},
            {name: `Artstation`, ref: `artstation.com/`}
        ]
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, bot:{db, supportServer} }) {
        await this.requestUserMetadata(2)

        //  Display missing argument if user doesn't provide any argument
        if (!this.args[0]) return reply(this.locale.SETSOCIALMEDIA.MISSING_ARG, {color: `red`})
        //  Handle if user's provided url is not supported
        const getSource = this.source.filter(source => this.args[0].includes(source.ref))
        if (!getSource.length) return reply(this.locale.SETSOCIALMEDIA.SOURCE_UNSUPPORTED, {
            socket: {
                list: this.source.map(key => key.name).join(`, `),
                supportServer: supportServer
            },
            color: `red`
        })
        //  Handle if target account link is already registered
        const alreadyHasAccount = this.user.socialMedias.filter(key => key.account_type === getSource[0].name)
        if (alreadyHasAccount.length > 0) return reply(this.locale.SETSOCIALMEDIA.ALREADY_REGISTERED, {
            color: `red`,
            socket: {
                account: getSource[0].name,
                emoji: emoji(`AnnieDead`)
            }
        })

        await db.setUserSocialMedia(getSource[0].name, this.args[0], this.user.id)
        return reply(this.locale.SETSOCIALMEDIA.SUCCESSFUL, {
            socket: {
                account: getSource[0].name,
            },
            color: `lightgreen`
        })
    }
}

module.exports.help = {
    start: SetSocialMedia,
    name: `setSocialMedia`,
    aliases: [`linkaccount`, `linksocmed`, `linksocialmedia`, `setaccount`, `connectaccount`, `setsocialmedia`],
    description: `Registering your social media account.`,
    usage: `setsocialmedia <AccountURL>`,
    group: `Setting`,
    permissionLevel: 0,
    multiUser: false
}

