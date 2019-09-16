const Discord = require(`discord.js`)
const formatManager = require(`../../utils/formatManager`)
const ms = require(`parse-ms`)
const sql = require(`sqlite`)
sql.open(`.data/database.sqlite`)
class stats {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const { message, bot, palette, pause } = this.stacks

		const format = new formatManager(message)
		return [`485922866689474571`, `614737097454125056`].includes(message.channel.id) ? initInfo() :
			format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get(`485922866689474571`).toString()}.`)



		async function initInfo() {

			let res_todayarts
			const get_todayarts = async () => {
				let prevday, midnight

				sql.get(`SELECT DATETIME('now', '-1 days')`)
					.then(async time => prevday = new Date(Object.values(time)).getTime())

				sql.get(`SELECT DATETIME('now')`)
					.then(async time => midnight = new Date(Object.values(time)).getTime())

				await pause(1000)
				return sql.all(`SELECT * FROM userartworks WHERE timestamp >= ${prevday} AND timestamp < ${midnight} ORDER BY timestamp DESC`)
					.then(async artdata => res_todayarts = artdata)
			}

			const fetched = () => {

				let bicon = bot.user.displayAvatarURL
				let uptimeFixed = ms(bot.uptime)

				let onmem = message.guild.members.filter(a => a.user.presence.status === `online`).size
				let idlemem = message.guild.members.filter(a => a.user.presence.status === `idle`).size
				let dndmem = message.guild.members.filter(a => a.user.presence.status === `dnd`).size


				let art_insights = res_todayarts.length > 1 ?
					`I've found ${res_todayarts.length} new posts today.\nThe most recent one was posted in #${res_todayarts[0].location} by ${bot.users.get(res_todayarts[0].userId).username}.` :
					`No post yet.`

				let botembed = new Discord.RichEmbed()
					.setColor(palette.darkmatte)
					.addField(`⚙ **System**`,
						`\`\`\`json\n» Uptime      :: ${uptimeFixed.hours}h ${uptimeFixed.minutes}m ${uptimeFixed.seconds}s\n» Memory      :: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n» CPU         :: ${(process.cpuUsage().system / 1024 / 1024).toFixed(2)} %\n\`\`\``)
					.addField(`:oil: **API**`,
						`\`\`\`asciidoc\n[orangeannie]\n\`\`\``, true)
					.addField(`:busts_in_silhouette: Online Users`,
						`\`\`\`json\n${onmem + idlemem + dndmem}\n\`\`\``, true)
					.addField(`:bar_chart: Latency`,
						`\`\`\`fix\n${Math.round(bot.ping)}ms\n\`\`\``, true)
					.addField(`<:AnnieWot:541442720531480576> Server Insights`,
						`\`\`\`fix\n${art_insights}\n\`\`\``, true)

					.setFooter(`App Information`, bicon)

				return message.channel.send(botembed)
			}

			get_todayarts()
			return message.channel.send(`\`Fetching annie's data ..\``)
				.then(async msg => {
					await pause(1000)

					msg.delete()
					fetched()
				})
		}
	}
}

module.exports.help = {
	start: stats,
	name: `stats`,
	aliases: [`anniestatus`, `botinfo`, `annieinfo`],
	description: `Gives info about the bot`,
	usage: `anniestats`,
	group: `server`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}