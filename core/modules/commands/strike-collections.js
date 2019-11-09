const Discord = require(`discord.js`)
const moment = require(`moment`)
const formatManager = require(`../../utils/formatManager`)
const sql = require(`sqlite`)
sql.open(`.data/database.sqlite`)
const env = require(`../../../.data/environment`)
class strikeCollection {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const { message, bot, bot:{logger}, palette, command, utils } = this.stacks
		const format = new formatManager(message)

		/**
         *  Auto-strike penalty such as mute, kick or ban are disabled
         *  while doing local development to avoid unexpected behaviour.
         * 
         *  1-2 points => temporary mute
         *  3 points => kick
         *  4+ points lead to permanent ban.
         * 
         *  For whoever see this message and want to change the penalties,
         *  please refer to line 145.
         *  @strikecollection
         */


		//  Centralized Object
		let metadata = {
			admin: {
				id: message.author.id,
				name: message.author.username,
				tag: message.author.tag
			},
			records_size: 0,
			current_date: 0,
			last_entry: null
		}


		//  Pre-defined messages.
		const log = (props = {}, ...opt) => {

			//  Messages collection.
			const logtext = {
				"UNAUTHORIZED": {
					color: palette.crimson,
					msg: `You aren't authorized to use the feature.`
				},

				"MUTED": {
					color: palette.lightgreen,
					msg: `Poor **${opt[0]}** got their first few strikes. I'll mute them for now.`
				},

				"KICKED": {
					color: palette.lightgreen,
					msg: `So far 3 strikes have been landed. Baibai **${opt[0]}**!`
				},

				"BANNED": {
					color: palette.lightgreen,
					msg: `Geez.. **${opt[0]}** strikes already. I've banned **${opt[1]}** out of our place.`
				},

				"INSIGHTS": {
					color: palette.crimson,
					msg: `Hey **${opt[0]}**, here's the strike data for **${opt[1]}**\n\n${opt[2]}\n\nType \`+ <reason>\` to add new strike. Type \`-\` to remove the most recent strike.`
				},

				"NEW_ENTRY_SUCCESSFUL": {
					color: palette.darkmatte,
					msg: `Thankyou **${opt[0]}**! your report has been registered.`
				},

				"ENTRY_DELETED": {
					color: palette.darkmatte,
					msg: `Thankyou **${opt[0]}**! the most recent record for **${opt[1]}** has been deleted.`
				},

				"TOO_SHORT": {
					color: palette.darkmatte,
					msg: `The description is too short!`
				},

				"INVALID_USER": {
					color: palette.darkmatte,
					msg: `Sorry, i can't find that user.`
				},

				"NO_RECORDS_FOUND": {
					color: palette.darkmatte,
					msg: `**${opt[0]}** doesn't have any strike record yet. Type \`+ <reason>\` to add new strike.`
				},

				"SHORT_GUIDE": {
					color: palette.darkmatte,
					msg: `You are authorized to access the strike-system. Each strike point will automatically give them
                such as temporary mute, kick and ban so please use it wisely.`
				},

				"TEST": {
					color: palette.darkmatte,
					msg: `${opt[0]}[0] - ${opt[1]}[1]`
				}
			}

			const res = logtext[props.code]
			return format.embedWrapper(res.color, res.msg)
		}


		//  strike-collection utils.
		class Query {


			constructor(member) {
				this.member = member
			}


			//  Display user's strike history.
			get view() {
				return sql.all(`SELECT * FROM strike_list WHERE userId = "${metadata.target.id}" AND strike_type != 'complaint' ORDER BY timestamp DESC`)
			}


			//  Mute user temporarily.
			get mute() {
				if (!env.dev) this.member.addRole(`467171602048745472`)
				return log({ code: `MUTED` }, metadata.target.user.username)
			}


			//  Kick user temporarily.
			get kick() {
				if (!env.dev) this.member.kick()
				return log({ code: `KICKED` }, metadata.target.user.username)
			}


			//  Ban user permanently.
			get ban() {
				if (!env.dev) this.member.ban()
				return log({ code: `BANNED` }, metadata.records_size, metadata.target.user.username)
			}


			//  Penalties will be given after new strike being added.
			get penalty() {
				const v = metadata.records_size
				return v == 1 ? this.mute : v == 2 ? this.mute : v == 3 ? this.kick : this.ban
			}


			//  Add new user's strike record
			get register() {
				logger.info(`${metadata.admin.name} has reported ${metadata.target.id}.`)
				return sql.run(`INSERT INTO strike_list(timestamp, assigned_by, userId, reason, strike_type)
                    VALUES (${metadata.current_date}, "${metadata.admin.id}", "${metadata.target.id}", "${metadata.reason}", "strike")`)
			}

			//  Delete user's newest strike record
			get unregister() {
				logger.info(`${metadata.admin.name} has removed a strike from ${metadata.target.id}.`)
				sql.run(`DELETE FROM strike_list
                    WHERE timestamp = ${metadata.last_entry.timestamp}
                    AND assigned_by = "${metadata.last_entry.assigned_by}"
                    AND userId = "${metadata.last_entry.userId}"
					AND reason = "${metadata.last_entry.reason}"
					AND strike_type = "strike"`)
				return log({ code: `ENTRY_DELETED` }, metadata.admin.name, metadata.target.user.username)
			}

		}


		//  Core proccesses.
		const main = async () => {

			let query = new Query(message.guild.members.get(metadata.target.id))
			let res_view = await query.view
			metadata.records_size = res_view.length
			if (res_view.length > 0) metadata.last_entry = res_view[0]


			//  Display parsed result from available user's strike record.
			const insights = () => {
				let str = `Total **${metadata.records_size}** records were found
            The recent one was reported by **${bot.users.get(res_view[0].assigned_by).username}**
            At ${moment(res_view[0].timestamp).format(`dddd, MMMM Do YYYY, h:mm:ss a`)}
            \nLook below for detailed logs.`

				for (let index in res_view) {
					str += `\n[${moment(res_view[index].timestamp).format(`MMMM Do YYYY, h:mm:ss a`)}](https://discord.gg/Tjsck8F) - ${bot.users.get(res_view[index].assigned_by).username} "${res_view[index].reason}"`
				}
				return str
			}


			// Check if there's any report that able to show.
			metadata.records_size < 1
				? log(
					{ code: `NO_RECORDS_FOUND` },
					metadata.target.user.username
				)
				: log(
					{ code: `INSIGHTS` },
					metadata.admin.name,
					metadata.target.user.username,
					insights()
				)


			//  Listening to second response.
			const collector = new Discord.MessageCollector(message.channel,
				m => m.author.id === message.author.id, {
					max: 1,
					time: 60000,
				})


			collector.on(`collect`, async (msg) => {
				let input = msg.content


				//  Register new strike record
				if (input.startsWith(`+`)) {
					metadata.reason = input.substring(1).trim()
					metadata.current_date = Date.now()
					metadata.records_size = res_view.length + 1

					// Store new record.
					query.register

					//  Give penalty to the user based on their total records.
					query.penalty
					collector.stop()
				}
				else if (input.startsWith(`-`)) {
					if (metadata.records_size > 0) {
						metadata.records_size--
						query.unregister
					}
					collector.stop()
				}
				else {
					collector.stop()
				}

			})

		}


		//  Initial process
		const run = async () => {

			const { isAdmin } = this.stacks

			//  Returns when the user doesn't have admin authority.
			if (!isAdmin) return log({ code: `UNAUTHORIZED` })

			function ltrim(str) {
				if (!str) return str
				return str.replace(/^\s+/g, ``)
			}

			//  Returns tutorial
			if (message.content.length <= command.length + 1) return log({ code: `SHORT_GUIDE` })

			// Prepare set of args to get target person
			let arg = ltrim(message.content.substring(command.length + env.prefix.length + 1))

			//  Returns if target is not valid member.
			metadata.target = await utils.userFinding(arg)
			if (!metadata.target) return log({ code: `INVALID_USER` })


			return main()
		}

		run()
	}
}

module.exports.help = {
	start: strikeCollection,
	name: `strike-collections`,
	aliases: [`strike`,`strikes`, `strikez`],
	description: `Give a strike to a user`,
	usage: `strike @user`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}