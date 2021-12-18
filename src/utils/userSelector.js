`use-strict`

/**
 * Handles user selection.
 * @utils as userFinding function source
 * @args as a chunks of message
 */
class userSelector {
	constructor(data) {
		this.args = data.args
		this.message = data.message
		this.cmd = data.commandfile.help
	}

	/**
     * Finds a user by id, or tag or plain name
     * @param target the arg for the user (id, name, mention)
     * @returns {object} user object
     */
	async findUser(target) {
		try {
			const userPattern = /^(?:<@!?)?([0-9]+)>?$/
			if (userPattern.test(target)) target = target.replace(userPattern, `$1`)
			let members = this.message.guild.members

			const filter = member => member.user.id === target ||
                member.displayName.toLowerCase() === target.toLowerCase() ||
                member.user.username.toLowerCase() === target.toLowerCase() ||
                member.user.tag.toLowerCase() === target.toLowerCase()

			return members.filter(filter).first()
		}
		catch(e) {
			return null
		}
	}

	ltrim(str) {
		if (!str) return str
		return str.replace(/^\s+/g, ``)
	}

	rtrim(str) {
		if (!str) return str
		return str.replace(/\s+$/g, ``)
	}

	async get(){
		return !this.args[0] || !this.cmd.multi_user ? await this.findUser(this.message.author.id) : await this.findUser(this.message.content.slice(this.message.content.indexOf(this.args[0])))
	}

	async getUser() {
		this.args[0] = this.ltrim(this.args[0])
		this.args[0] = this.rtrim(this.args[0])
		return await this.findUser(this.args[0])
	}

}

module.exports = userSelector