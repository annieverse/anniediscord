const moment = require(`moment`);

/**
 * Main module
 * @Rep as function to handle user dailies reputation pointl
 */
class Rep {
	constructor(Stacks) {
		this.stacks = Stacks;
		this.senderMeta = {
			data: null,
			author: null
		}
	}


    /**
     *  Get sender's author object and inventory metadata.
     */
    async assignSenderMetadata() {
        const { reqData } = this.stacks;
        const res = await reqData();
        this.senderMeta = res
    }


    /**
     *	Initializer method
     */
	async execute() {
		const { args, reply, db, name, selfTargeting, palette, code: {REP}, meta: {author, data} } = this.stacks;


		//	Get sender's metadata
		await this.assignSenderMetadata()


		//	Centralized metadata
		let metadata = {
			cooldown: 8.64e+7,
			amount: 1,
			get inCooldown() {
				return (this.senderMeta.data.repcooldown !== null) && this.cooldown - (Date.now() - this.senderMeta.data.repcooldown) > 0 ? true : false;
			}
		}


		//	Returns if user rep duration still in cooldown
		if (metadata.inCooldown) return reply(REP.IN_COOLDOWN, {
			socket: [moment(data.repcooldown + metadata.cooldown).fromNow()],
			color: palette.red
		})
		//	Returns short-guide if user doesn't specify any parameter
		if (!args[0]) return reply(REP.SHORT_GUIDE)
		//	Returns if target user is invalid
		if (!author) return reply(REP.INVALID_USER)
		//	Returns if user is trying to rep themselves
		if (selfTargeting) return reply(REP.SELF_TARGETING)


		//	Assign target id into metadata
		metadata.target_id = author.id;
		//	Update database
		await db(this.senderMeta.author.id).updateReps(metadata)


		//	Successful
		return reply(REP.SUCCESSFUL, {
			socket: [name(author.id), name(this.senderMeta.author.id)],
			color: palette.lightgreen
		})
	}
}

module.exports.help = {
	start: Rep,
	name: "rep",
	aliases: [],
	description: `Gives rep to a user`,
	usage: `${require(`../../.data/environment.json`).prefix}rep @user`,
	group: "General",
	public: true,
	required_usermetadata: true,
	multi_user: true
}