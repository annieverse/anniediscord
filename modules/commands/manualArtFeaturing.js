
/**
 * Main module
 * @manualFeaturing manually featuring arts
 */
class manualFeaturing {
    constructor(Stacks) {
        this.stacks = Stacks;
    }


    /**
     *  Get sender's author object and inventory metadata.
     */
    async assignSenderMetadata() {
        const { reqData } = this.stacks;
        const res = await reqData();
        this.senderMeta = res;
    }


    /**
     *	Initializer method
     */
    async execute() {
        const { isAdmin, collector, code, avatar, name, reply, avatarWrapper, db, meta: {author} } = this.stacks;

        //  Get sender's metadata
        await this.assignSenderMetadata()
        //  Returns if user has no admin authority
        if (!isAdmin) return reply(code.UNAUTHORIZED_ACCESS)
        //  Returns if target user is invalid
        if (!author) return reply(code.INVALID_USER)

        reply(`test`)
        .then(async confirmation => {
            collector.on(`collect`, async msg => {
                let link = msg.content;

                reply(`\u200C\n${link}\n\u200C`, {
                    header: `${name(author.id)}'s work featured by ${name(this.senderMeta.author.id)}`,
                    thumbnail: link,
                    prebuffer: true
                })
            })
        })

        //  Successful
        return reply(code.RESET_INVENTORY, {
            socket: [name(author.id)]
        })
    }
}

module.exports.help = {
    start: manualFeaturing,
    name: "manualArtFeaturing",
    aliases: ["featuring"],
    description: `manually featuring arts`,
    usage: `${require(`../../.data/environment.json`).prefix}_resetinventory`,
    group: "Admin",
	public: true,
	required_usermetadata: true,
	multi_user: true
}