const Discord = require(`discord.js`)
const moment = require(`moment`)
const formatManager = require(`../../utils/formatManager`)
const fs = require(`fs`)
const env = require(`../../../.data/environment`)

class serverRemote {
	constructor(Stacks) {
		this.utils = Stacks.utils
		this.message = Stacks.message
		this.args = Stacks.args
		this.palette = Stacks.palette
		this.stacks = Stacks
		this.logger = Stacks.bot.logger
	}

	async execute() {
		let message = this.message
		let bot = this.stacks.bot
		let palette = this.stacks.palette
		//  Centralized object
		let metadata = {
			report: bot.channels.get(`580889690677444618`),
			user: {
				id: message.author.id,
				name: message.author.username,
				tag: message.author.tag
			},
			rs_countdown: 5000,
		}


		// Pre-defined messages.
		const log = async (props = { code: ``, delete_in: 0 }) => {
			!props.delete_in ? props.delete_in = null : props.delete_in
			const format = new formatManager(message)

			const logtext = {
				"SHORT_GUIDE": {
					color: palette.darkmatte,
					msg: `You are authorized to shutdown/restart the server.`
				},

				"REQUESTING": {
					color: palette.red,
					msg: `**Server will restart in ${metadata.rs_countdown / 1000} seconds ..**`
				},

				"UNKNOWN_PARAMETER": {
					color: palette.darkmatte,
					msg: `Below are the available parameters.
                    \`-live enable production server\`
                    \`-mt switch to dev environment\`
                    \`-rs restart the server gracefully\``
				},

				"ALREADY_IN_DEV": {
					color: palette.crimson,
					msg: `Maintenance still undergoing.`
				},

				"ALREADY_IN_PRODUCTION": {
					color: palette.crimson,
					msg: `Currently is running in production server!`
				},
			}


			const res = logtext[props.code]
			return format.embedWrapper(res.color, res.msg, false)
				.then(async cb_msg => {
					props.delete_in ? cb_msg.delete(props.delete_in) : null
				})
		}


		//  Send latest database to report channel.
		const get_database = () => {
			metadata.report.send(`Server has been shutdown at ${moment(Date.now()).format(`dddd, MMMM Do YYYY, h:mm:ss a`)}`,
				new Discord.Attachment(`.data/database.sqlite`, `${Date.now()}.sqlite`))
			metadata.report.send(`Here are the logs:`,
				new Discord.Attachment(`logs.txt`, `${Date.now()}-logs.txt`))
		}


		//  Restart the server.
		const restart_server = async (countdown) => {
			await this.stacks.pause(countdown)
			process.exit()
		}


		//  Setup user interactions such as commands.
		const user_interactions = (mode = false) => {

			fs.readFile(`.data/environment.json`, `utf8`, (err, data) => {
				let obj = JSON.parse(data)

				obj.dev = mode ? false : true
				obj.active_exp = mode ? true : false

				fs.writeFile(`.data/environment.json`, JSON.stringify(obj, null, 4), () => {
					this.logger.info(`Shutting down the server, ..`)
				})
			})
		}


		//  Core processes
		const main = async () => {

			class Proc {

				constructor(arg) {
					this.arg = arg.substring(1)
				}


				//  Restart server
				get rs() {
					metadata.rs_countdown = 2000
					return restart_server(2000)
				}


				//  Set server to production
				get live() {
					metadata.rs_countdown = 10000
					user_interactions(true)
					return restart_server(metadata.rs_countdown)
				}


				//  Set server to dev environment
				get mt() {
					metadata.rs_countdown = 10000
					user_interactions(false)
					get_database()
					return restart_server(metadata.rs_countdown)
				}


				//  Getter selector
				get run() {
					return this[this.arg]
				}

			}

			const proc = new Proc(this.args[0])
			proc.run
			message.delete()
			log({ code: `REQUESTING`, delete_in: metadata.rs_countdown - 1000 })

		}


		//  Initialization
		const run = () => {
			const parameters = [`-live`, `-mt`, `-rs`]

			//  Returns if user is not listed in developer team.
			if (!message.member.roles.find(r => (r.name === `Developer Team`))) return


			//  Returns message if no parameter was specified.
			if (!this.args[0]) return log({ code: `SHORT_GUIDE` })


			//  Returns invalid parameter.
			if (!parameters.includes(this.args[0])) return log({ code: `UNKNOWN_PARAMETER` })


			//  Returns if already in dev environment.
			if (env.dev && (this.args[0] === `-mt`)) return log({ code: `ALREADY_IN_DEV` })


			//  Returns if already in production server.
			if (!env.dev && (this.args[0] === `-live`)) return log({ code: `ALREADY_IN_PRODUCTION` })


			return main()
		}

		run()
	}
}

module.exports.help = {
	start: serverRemote,
	name: `server-remote`,
	aliases: [`server`],
	description: `Developer Command | remote control of bot`,
	usage: `server <command>`,
	group: `Admin`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}