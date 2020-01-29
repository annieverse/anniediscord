const fs = require(`fs`)

/**
 * 	Developer Toolkits.
 * 	Switching server configuration remotely. 
 * 	@serverRemote
 */
class ServerRemote {
	constructor(Stacks) {
		this.stacks = Stacks
		this.logger = Stacks.bot.logger
		this.pause = Stacks.pause
		this.restartCountdown = 5000
	}


	async execute() {
		const { isDev, emoji, bot:{env}, args, code:{SERVER_REMOTE}, reply, meta:{author} } = this.stacks
		const parameters = [`live`, `mt`, `rs`]

		//  Ignore non-dev
		if (!isDev) return
		//  Tell author if they are authorized.
		if (!args[0]) return reply(SERVER_REMOTE.AUTHORIZED, {socket: [author.user.username, emoji(`AnnieSmile`)]})

		//	Remove substract symbol(-) from args.
		const flag = args[0].substring(1)

		//  Handle invalid parameter.
		if (!parameters.includes(flag)) return reply(SERVER_REMOTE.GUIDE)
		//  Handle attempt to duplicate development environment.
		if (env.dev && (flag === `mt`)) return reply(SERVER_REMOTE.CURRENTLY_MT)
		//  Handle attempt to duplicate production environment.
		if (!env.dev && (flag === `live`)) return reply(SERVER_REMOTE.CURRENTLY_LIVE)

		//	Running
		this[flag]()
		reply(SERVER_REMOTE.PROCESSING, {socket: [this.restartCountdown/1000]})

	}


	/**
	 * -----------------------------------------------------------
	 * 	Keys
	 * -----------------------------------------------------------
	 */
	rs() {
		//	We use 2 seconds for faster reload since we don't write anything to the disk.
		this._restartServer(2000)
	}

	live() {
		this._toggleAccess(true)
		this._restartServer()
	}

	mt() {
		this._toggleAccess(false)
		this._restartServer()
	}
	

	/**
	 * 	Kill process to trigger the pm2 module.
	 * 	@param {Number|Integer} countdown 
	 */
	async _restartServer(countdown = this.restartCountdown) {
		this.logger.info(`Restarting the server in ${countdown/1000}s...`)
		await this.pause(countdown)
		process.exit()
	}


	/**
	 * 	Switching configuration to development or production.
	 * 	@param {Boolean} mode true for production, false for development.
	 */
	_toggleAccess(mode = false) {
		fs.readFile(`.data/environment.json`, `utf8`, (err, data) => {
			//	Handle error
			if (err) return this.logger.error(`Something went wrong with _toggleAccess() method. > ${err}`)

			let obj = JSON.parse(data)
			obj.dev = mode ? false : true
			obj.active_exp = mode ? true : false

			fs.writeFile(`.data/environment.json`, JSON.stringify(obj, null, 4), (seconderr) => {
				//	Handle error
				if (seconderr) return this.logger.error(`Something went wrong while writing to disk with _toggleAccess() method. > ${seconderr}`)
				this.logger.info(`Toggle user access to ${mode}`)
			})
		})
	}


}

module.exports.help = {
	start: ServerRemote,
	name: `ServerRemote`,
	aliases: [`server`, `svr`],
	description: `Developer Toolkits`,
	usage: `server <command>`,
	group: `Admin`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}