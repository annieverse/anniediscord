const cron = require(`node-cron`)
const fs = require(`fs`)
const path = require(`path`)
const getCpuUsage = require(`../utils/cpuUsage`)
const getMemUsage = require(`../utils/memoryUsage`)
/**
 *  Please only add new method if it intentionally used for scheduled task like in ready.js
 *  @param {Object} Client current this.client instance
 */
class Routines {
	constructor(Client) {
		this.client = Client
		this.logger = Client.logger
		this.db = Client.db
		this.env = Client.dev
		this.pixivCacheDirectory = path.join(__dirname, `../../.pixivcaches`)
		this.allowedGuilds = []
		this.supportServer = Client.guilds.cache.get(`577121315480272908`)
	}

	async getServers() {
		let res = await this.client.db.getNitroColorChange()
		this.allowedGuilds = res
	}

	/**
	 * Change color of role
	 * @roleChange
	 */
	async roleChange() {

		const client = this.client
		const logger = this.logger

		/**
		 * get activated role change servers
		 */

		await this.getServers()

		/**
		 * The Varible "x" is in terms of minutes
		 * for example:
		 * 1 = 1 minute
		 * etc.
		 */
		let x = 15

		/**
		 * The roleSelector is a list of every role you want to change.
		 * TODO: Use group id instead of group name.
		 */
		let roleSelector = this.allowedGuilds
		/**
		 * The colorArray is a list of every color you want to change.
		 */
		let colorArray = [
			`FF9AA2`,
			`FFB7B2`,
			`FFDAC1`,
			`E2F0CB`,
			`b5EAD7`,
			`C7CEEA`,
			`F8B195`,
			`F67280`,
			`79fa72`,
			`d3fa7f`,
			`ca8ae4`,
			`fff177`
		]

		/**
		 * Count is used to run through the colorArray in order.
		 */
		let count = 0

		/**
		 * The setInterval controls how long it takes before the color changes.
		 * The setTimeout makes sure new values are assigned each time.
		 */
		setInterval(() => {
			setTimeout(() => {
				autoRoleColorChange(roleSelector)
			}, null)
		}, 60000 * x)

		/**
		 * Random color for each role selected right off the bat when this.client starts - initializes the changing sequence
		 */
		autoRoleColorChange(roleSelector)

		/**
		 * Pass through a array of role names and they will automically be processed and change each one to a new color.
		 * @function grabRole() 
		 * @function randomColor()
		 * @function main()
		 * @function run()
		 * @param {array} roleNameInput Array of string elements
		 */
		function autoRoleColorChange(roleNameInput) {

			/**
			 * Pass through the role's name and it will return the role object
			 * @param {string} role 
			 * @returns {object} Role Object
			 */
			async function grabRole(role, guild_id) {
				return client.guilds.get(guild_id).roles.find(n => n.id === role)
			}

			/**
			 * @returns {string} A(n) color in hex format from the colorArray
			 */
			async function setColor() {


				// color code starts with # 
				var color = `#`

				//assigns the color using the colorArray values
				color += colorArray[count]

				// Increase the count by one
				count++
				if (count === colorArray.length) count = 0
				return color
			}

			/**
			 * runs the core processing of the whole function
			 * @param {string} roleName Role name
			 */
			async function main(roleName, guild_id) {

				// For random color
				//let color = await randomColor();
				// Use colorArray
				let color = await setColor()

				let role = await grabRole(roleName, guild_id)
				logger.info(`The color for "${role.name}" has been changed to "${color}" from "${role.hexColor}"`)
				role.setColor(color)
			}

			/**
			 * Initilizes the whole function to run, by separating the array of role names and calls the main() to process them.
			 * @param {string} role Role name
			 */
			function run(role) {
				for (let index = 0; index < role.length; index++) {
					main(role[index].nitro_role, role[index].guild_id)
				}
			}

			// Call the run function and start the process
			run(roleNameInput)
		}
	}

	/**
	 * Automatically record resource usage data every 5 min.
	 * @returns {void}
	 */
	resourceUsageLogging() {
		/**
		 * The Variable "x" is in terms of minutes
		 * for example:
		 * 1 = 1 minute
		 * etc.
		 */
		let x = 5

		/**
		 * The setInterval controls how long it takes before the color changes.
		 * The setTimeout makes sure new values are assigned each time.
		 */
		setInterval(() => {
			setTimeout(() => {
				/**
				 * 	Note: the available data to be stored currently only covered the necessary ones.
				 * 	More new different kind of data will be recorded in the future.
				 */
				let params = [this.client.uptime, this.client.ws.ping, getCpuUsage(), getMemUsage()]
				this.db._query(`
					INSERT INTO resource_log(uptime, ping, cpu, memory)
					VALUES(?, ?, ?, ?)`, `run`, params)
				this.logger.info(`Resource usage has been recorded.`)
			}, null)
		}, 60000 * x)
	}

	/**
	 * 	Check if pixiv cache's directory is exists or not.
	 * 	If no, create the directory.
	 */
	pixivCacheDirCheck() {
		fs.access(this.pixivCacheDirectory, (err) => {
			if (err) {
				fs.mkdir(this.pixivCacheDirectory, () => {
					this.logger.info(`Created Pixiv Cache's directory.`)
				})
			}
		})
	}

	/**
	 * 	Deletes Pixiv Caches for every 30 minutes.
	 */
	releasePixivCaches() {
		cron.schedule(`*/30 * * * *`, async () => {
			fs.readdir(`.//.pixivcaches`, (err, files) => {
				if (err) throw err
				for (let file of files) {
					fs.unlink(path.join(`./.pixivcaches`, file), () => {
						this.logger.info(`${files.length} Pixiv Caches have been released.`)
					})
				}
			})
		})
	}
}

module.exports = Routines