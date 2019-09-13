module.exports = bot => {

	//	Extract required part from Client
	const { db, env, logger } = bot

	startup()


	/**
     * secret thingy, change color of role
     * @roleChange
     */
	function roleChange(){
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
		let roleSelector=[
			`585550404197285889`
		]
		/**
         * The colorArray is a list of every color you want to change.
         */
		let colorArray=[
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
		}, 60000*x)

		/**
         * Random color for each role selected right off the bat when bot starts - initializes the changing sequence
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
		function autoRoleColorChange(roleNameInput){

			/**
             * Pass through the role's name and it will return the role object
             * @param {string} role 
             * @returns {object} Role Object
             */
			async function grabRole(role){
				return bot.guilds.get(`459891664182312980`).roles.find(n => n.id === role)
			}

            
			/**
             * @returns {string} A(n) color in hex format from the colorArray
             */
			async function setColor(){
                

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
			async function main(roleName) {

				// For random color
				//let color = await randomColor();
				// Use colorArray
				let color = await setColor()
                
				let role = await grabRole(roleName)
				logger.info(`The color for "${role.name}" has been changed to "${color}" from "${role.hexColor}"`)
				role.setColor(color)
			}

			/**
             * Initilizes the whole function to run, by separating the array of role names and calls the main() to process them.
             * @param {string} role Role name
             */
			function run(role) {
				for (let index = 0; index < role.length; index++) {
					main(role[index])
				}
			}

			// Call the run function and start the process
			run(roleNameInput)
		}
	}


	/**
     *  Automatically change current bot status presence
     *  @autoStatus
	 * 
	 * 	--	Disabled Temporary --
	 * 
	 * 	Note:
	 * 	1. Please rework this function to integrate with databaseManager. 
     */
	/*
	function autoStatus(){

		let x = 1 // number of minutes
		setInterval(data,60000*x)
		sql.open(`.data/database.sqlite`)
        
		function data(){
			sql.get(`SELECT * FROM event_data WHERE NOT category = 'weekly' ORDER BY start_time`).then(data=>{
				if (!data) {
					if (env.dev) {
						return bot.user.setActivity(`maintenance.`, {
							type: `LISTENING`
						})

					} else {
						return bot.user.setActivity(null)
					}
				}
				let event = data.name
				let time = data.start_time
				let status = data.status
				let currentTime = (new Date())
				let bufferTime = {
					before: (new Date(time - 1.8e+7)),
					after: (new Date(time + 7.2e+6)),
					start: (new Date(time))
				}
				// watching = type 3
				// playing = type 0

				if (status === `ended`) {
					sql.run(`DELETE FROM event_data WHERE active = 1 AND name = '${event}' AND start_time = ${time} AND repeat_after = 0`).then(() => {
						return console.log(`Event: ${event} with start time of: ${time} has been deleted from the database.`)
					})
				}
                
				if (bufferTime.after < currentTime) {
					if (env.dev) {
						bot.user.setStatus(`dnd`)
						bot.user.setActivity(`maintenance.`, {
							type: `LISTENING`
						})

					} else {
						bot.user.setStatus(`online`)
						bot.user.setActivity(null)
					}
					if (data.repeat_after === 0){
						sql.run(`UPDATE event_data SET active = 1 WHERE name = '${event}' and start_time = ${time}`).then(() => {
							sql.run(`DELETE FROM event_data WHERE status = 1 AND name = '${event}' AND start_time = ${time}`).then(() => {
								console.log(`Event: ${event} with start time of: ${time} has been deleted from the database.`)
							})
						})
					} else {
						let diff = data.length-time
						sql.run(`UPDATE event_data SET start_time = ${time+data.length}, length = ${diff} WHERE name = '${event}' AND start_time = ${time}`)
					}
					return console.log(`[STATUS CHANGE] ${bot.user.username} is now set to null`)
				} else if (bot.user.presence.game !== null){
					if (bot.user.presence.game.name === `[EVENT] ${event}` && bot.user.presence.game.type === 0) return
				}
				// Find the distance between now and the count down date
				var distance = bufferTime.start.getTime()-currentTime.getTime() 
				// Time calculations for days, hours, minutes and seconds
				var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
				var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
                
				if (bufferTime.before < currentTime  && bufferTime.start > currentTime  ){
                    
					let countDown = `${hours}h ${minutes}m`
					bot.user.setActivity(`[EVENT] ${event} in ${countDown}`, {
						type: `WATCHING`
					})
					return console.log(`[STATUS CHANGE] ${bot.user.username} is now WATCHING ${event}`)
				} else if (bufferTime.start < currentTime  && bufferTime.after > currentTime ) {
					bot.user.setActivity(`[EVENT] ${event}`, {
						type: `PLAYING`
					})
					return console.log(`[STATUS CHANGE] ${bot.user.username} is now PLAYING ${event}`)
				}     
			})
		}
	}
	*/


	/**
     *  
     * Database table check & schema preparation
     * @setupDatabase
     */
	function setupDatabase() {

		//	Reset whole server cooldown to false/zero.
		db.resetCooldown()

	}


	/**
     * 
     * Fired processes on startup.
     * @startup
     */
	function startup() {


		/**
		 *	Only run on development server 
		 */
		if (env.dev) {
			logger.info(`${bot.user.username} up in dev environment. (${bot.getBenchmark(process.hrtime(bot.startupInit))})`)
			bot.user.setStatus(`dnd`)
			bot.user.setActivity(`maintenance.`, {
				type: `LISTENING`
			})

		} else {

			/**
             *  Production server
             */
			logger.info(`${bot.user.username}up in production. (${bot.getBenchmark(process.hrtime(bot.startupInit))})`)
			bot.user.setStatus(`online`)
			bot.user.setActivity(null)


			setupDatabase()
			roleChange()
		}
	}

}
