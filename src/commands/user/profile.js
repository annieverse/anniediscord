const profile = require(`../../ui/prebuild/profile`)
const portfolio = require(`../../struct/gui/portfolio`)
const badge = require(`../../struct/gui/badges`)
const family = require(`../../struct/gui/families`)
const friend = require(`../../struct/gui/friends`)
const Command = require(`../../libs/commands`)
/**
 * Displays your profile card, including timeline, badges, relationship, and statistics
 * @author klerikdust
 */
class Profile extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, bot:{db}, emoji, name }) {
        await this.requestUserMetadata(2)

        const familyrelations = this.user.relationships.filter((e) => {
            if (e.theirRelation == `bestie`) return false
            if (e.theirRelation == `soulmate`) return false
            if (e.theirRelation == `senpai`) return false
            if (e.theirRelation == `kouhai`) return false
            return true
        })
        const friendrelations =  this.user.relationships.filter((e) => {
            if (e.theirRelation == `bestie`) return true
            if (e.theirRelation == `soulmate`) return true
            if (e.theirRelation == `senpai`) return true
            if (e.theirRelation == `kouhai`) return true
            return false
        })

        /*Don't add empty pages*/
        let pages = [{gui: profile, card: this.locale.PROFILECARD, alias: `profile`}]
        if (this.user.posts.length > 0) {
            pages.push({gui: portfolio, card: this.locale.PORTFOLIOCARD, alias: `portfolio`})
        }
        if (this.user.inventory.raw.filter(key => key.type === `BADGES`).length > 0) {
            pages.push({gui: badge, card: this.locale.BADGECARD, alias: `badge`})
        }
        if (familyrelations.length > 0) {
            pages.push({gui: family, card: this.locale.RELATIONSHIPCARD, alias: `family`})
        }
        if (friendrelations.length > 0) {
            pages.push({gui: friend, card: this.locale.RELATIONSHIPCARD, alias: `friend`})
        }

        let count = 0
        //  Returns if user is invalid or lvl too low
        switch (this.commandName) {
            case `timeline`:
            case `portfolio`:
                if (!author) return reply(this.locale.PORTFOLIOCARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `portfolio`)
                break
            case `badges`:
            case `badge`:
                if (!author) return reply(this.locale.BADGECARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `badge`)
                break
            case `family`:
                if (!author) return reply(this.locale.RELATIONSHIPCARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `family`)
                break
            case `friend`:
            case `friends`:
                if (!author) return reply(this.locale.RELATIONSHIPCARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `friend`)
                break
        default:
            if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
        }

        const getPage = async (ctr) => {
            if (!pages[ctr]) return reply (`Couldn't find that card. It's probably empty.`)

            //  Fetching 
            reply(this.locale.COMMAND.FETCHING, {
                socket: {
                    emoji: emoji(`AAUloading`),
                    command: pages[ctr].alias,
                    user: this.user.id
                },
                simplified: true
            })
            .then(async load => {
                const GUI = await new pages[ctr].gui(this.user).build()
                reply(this.locale.COMMAND.TITLE, {
                    socket: {
                        user: name(this.user.id),
                        emoji: emoji(`AnnieSmile`),
                        command: pages[ctr].alias
                    },
                    image: GUI.toBuffer(),
                    prebuffer: true,
                    simplified: true })
                .then(msg => {
                    msg.react(`⏪`)
                    .then(() => {
                        msg.react(`⏩`)
                        const backwardsFilter = (reaction, user) => (reaction.emoji.name === `⏪`) && (user.id === message.author.id)
                        const forwardsFilter = (reaction, user) => (reaction.emoji.name === `⏩`) && (user.id === message.author.id)
    
                        const backwards = msg.createReactionCollector(backwardsFilter, {time: 60000})
                        const forwards = msg.createReactionCollector(forwardsFilter, {time: 60000})
    
                        backwards.on(`collect`, async () => {
                            count--
                            if (count < 0) {
                                count = pages.length - 1
                            }
                            await msg.delete()
                            getPage(count)
                        })
                        forwards.on(`collect`, async () => {
                            count++
                            if (count > pages.length - 1) {
                                count = 0
                            }
                            await msg.delete()
                            getPage(count)
                        })
                        
                        load.delete()
                        setTimeout(() => {
                            if (!msg.deleted) msg.clearReactions()
                        }, 60000)
                    })
                })
            })
        }
		//  Display result
        getPage(count)
	}
}

module.exports.help = {
	start: Profile,
	name: `profile`,
	aliases: [`profile`, `p`, `timeline`, `portfolio`, `badges`, `badge`, `family`, `friend`, `friends`],
	description: `Displays your profile card, including timeline, badges, relationship, and statistics`,
	usage: `profile <User>(Optional)`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}