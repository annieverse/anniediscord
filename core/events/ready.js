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
	
	function autoStatus(){
		let data = db.pullData(`event_data`)

		if (!data) {
			if (env.dev) {
				return bot.user.setActivity(`maintenance.`, {
					type: `LISTENING`
				})
			} else {
				return bot.user.setActivity(null)
			}
		}

		let metadata =
		{
			event : data.name,
			time: data.start_time,
			status: data.status,
			currentTime: (new Date()),
			bufferTime:
			{
				before: (new Date(this.time - 1.8e+7)),
				after: (new Date(this.time + 7.2e+6)),
				start: (new Date(this.time)),
			}
		}
		let countDown =
		{
			// Find the distance between now and the count down date
			distance: metadata.bufferTime.start.getTime() - metadata.currentTime.getTime(),
			// Time calculations for hours and minutes
			hours: Math.floor((this.distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
			minutes: Math.floor((this.distance % (1000 * 60 * 60)) / (1000 * 60)),
			timer: `${this.hours}h ${this.minutes}m`
		}
		let tests =
		{
			eventHasEnded: metadata.status === `ended`,
			eventIsOver: metadata.bufferTime.after < metadata.currentTime,
			doesEventEqualPresenceGame: bot.user.presence.game.name === `[EVENT] ${metadata.event}`,
			presenceTypeIsPlaying: bot.user.presence.game.type === 0,
			presenceGameNotNull: bot.user.presence.game !== null,
			eventDontRepeat: data.repeat_after === 0,
			eventIsHappening: metadata.bufferTime.before < metadata.currentTime && metadata.bufferTime.start > metadata.currentTime,
			eventHasntStarted: metadata.bufferTime.start < metadata.currentTime && metadata.bufferTime.after > metadata.currentTime
		}

		// watching = type 3
		// playing = type 0

		if (tests.eventHasEnded) return db.removeRowDataFromEventData(`name`,`${metadata.event}`,metadata.time)
		
		//tests.eventIsOver ? eventEnded() : tests.presenceGameNotNull ? tests.doesEventEqualPresenceGame && tests.presenceTypeIsPlaying ? () => { return } : () => { return } : () => { return }
		if (tests.eventIsOver) {
			eventEnded()
		} else if (tests.presenceGameNotNull) {
			if (tests.doesEventEqualPresenceGame && tests.presenceTypeIsPlaying) return
		}

		if (tests.eventHasntStarted) {
			eventStartingIn()			
		} else if (tests.eventIsHappening) {
			eventGoing()
		}
		
		function eventEnded(){
			env.dev ? ()=>
			{
				bot.user.setStatus(`dnd`)
				bot.user.setActivity(`maintenance.`, {
					type: `LISTENING`
				})
			} : () => 
			{
				bot.user.setStatus(`online`)
				bot.user.setActivity(null)
			}
			
			tests.eventDontRepeat? ()=>{
				db.updateEventDataActiveToOne(`${metadata.event}`, metadata.time)
				return db.removeRowDataFromEventData(`name`, `${metadata.event}`, metadata.time)
			} : () =>
			{
				let diff = data.length - metadata.time
				return db.updateRowDataFromEventData(`start_time = ${metadata.time + data.length}, length = ${diff}`, `name = '${metadata.event}' AND start_time = ${metadata.time}` )
			}
			
			return logger.info(`[STATUS CHANGE] ${bot.user.username} is now set to null`)
		}

		function eventStartingIn() {
			bot.user.setActivity(`[EVENT] ${metadata.event} in ${countDown.timer}`, {
				type: `WATCHING`
			})
			return logger.info(`[STATUS CHANGE] ${bot.user.username} is now WATCHING ${metadata.event}`)
		}

		function eventGoing() {
			bot.user.setActivity(`[EVENT] ${metadata.event}`, {
				type: `PLAYING`
			})
			return logger.info(`[STATUS CHANGE] ${bot.user.username} is now PLAYING ${metadata.event}`)
		}
	}

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

			autoStatus()
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
