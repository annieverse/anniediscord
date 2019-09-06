const profile = require(`../../utils/profilecardInterface`)
const portfolio = require(`../../utils/portfoliocardInterface`)
const badge = require(`../../utils/badgecardInterface`)
const relation = require(`../../utils/relationcardInterface`)
const stat = require(`../../utils/statcardInterface`)

/**
 * Main module
 * @Profile Display detailed user personal card.
 */
class Profile {
	constructor(Stacks) {
		this.stacks = Stacks
        this.portfolio_lv = 35
	}

	//          WORKING ON NEW SHOP INTERFACE
	/**
     *  Initialzer method
     */
	async execute() {
		const {message, command, reply, name, code: {PROFILECARD, PORTFOLIOCARD, BADGECARD, RELATIONSHIPCARD, STATCARD}, meta: {author, data} } = this.stacks
        var pages = [{gui: profile, card: PROFILECARD, alias: `profile`}]
        if (data && data.level > this.portfolio_lv) {
            pages.push({gui: portfolio, card: PORTFOLIOCARD, alias: `portfolio`})
        }
        pages.push({gui: badge, card: BADGECARD, alias: `badge`})
        pages.push({gui: relation, card: RELATIONSHIPCARD, alias: `relation`})
        pages.push({gui: stat, card: STATCARD, alias: `stat`})

        let count = 0
        //  Returns if user is invalid or lvl too low
        switch (command) {
            case `timeline`:
            case `portfolio`:
                if (!author) return reply(PORTFOLIOCARD.INVALID_USER)
                //  Returns if user level is below the requirement
                if (data.level < this.portfolio_lv) return reply(PORTFOLIOCARD.LVL_TOO_LOW, {socket: [this.portfolio_lv]})
                count = pages.findIndex((e) => e.alias == `portfolio`)
                break
            case `badges`:
            case `badge`:
                if (!author) return reply(BADGECARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `badge`)
                break
            case `relationship`:
            case `relation`:
            case `rel`:
                if (!author) return reply(RELATIONSHIPCARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `relation`)
                break
            case `stats`:
            case `stat`:
                if (!author) return reply(STATCARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `stat`)
                break
        default:
            if (!author) return reply(PROFILECARD.INVALID_USER)
        }

        const getPage = async (ctr) => {
            return reply(pages[ctr].card.HEADER, {
                socket: [name(author.id)],
                image: await pages[ctr].gui(this.stacks, author),
                prebuffer: true,
                simplified: true
            }).then(msg => {
                msg.react(`⏪`).then(() => {
                    msg.react(`⏩`)
                    const backwardsFilter = (reaction, user) => (reaction.emoji.name === `⏪`) && (user.id === message.author.id)
                    const forwardsFilter = (reaction, user) => (reaction.emoji.name === `⏩`) && (user.id === message.author.id)

                    const backwards = msg.createReactionCollector(backwardsFilter, {time: 60000})
                    const forwards = msg.createReactionCollector(forwardsFilter, {time: 60000})

                    backwards.on(`collect`, async r => {
                        count--
                        if (count < 0) {
                            count = pages.length - 1
                        }
                        await msg.delete()
                        getPage(count)

                    })
                    forwards.on(`collect`, async r => {
                        count++
                        if (count > pages.length - 1) {
                            count = 0
                        }
                        await msg.delete()
                        getPage(count)
                    })
                    setTimeout(() => {
                        if (!msg.deleted) msg.clearReactions()
                    }, 60000)
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
	aliases: [`profile`, `p`, `mycard`, `timeline`, `portfolio`, `badges`, `badge`, `relationship`, `relation`, `rel`, `stats`, `stat`],
	description: `Display user's profile card, including timeline, badges, relationship, and statistics`,
	usage: `profile [@user]<optional>`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}