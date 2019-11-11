const cron = require(`node-cron`)
module.exports = bot => {

	// Modules
	const scare = require(`../utils/ScareTheMascot`)
	let stm = new scare(bot)

	const dailyFeatured = require(`../utils/DailyFeaturedPost`)
	let fdp = new dailyFeatured(bot)

	//	Extract required part from Client
	const { db, env, logger } = bot

	startup()


	/**
     * Change color of role
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
     */
	
	function autoStatus(){
		let x = 1 // number of minutes

		update()
		setInterval(update, 60000 * x)

		async function update(){

			let data = await db.pullEventData(`event_data`)
			
			if (data[0] === undefined) {
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
				event : data[0].name,
				time: data[0].start_time,
				status: data[0].active,
				currentTime: (new Date()),
			}
			let bufferTime =
			{
				before: (new Date(metadata.time - 1.8e+7)),
				after: (new Date(metadata.time + 7.2e+6)),
				start: (new Date(metadata.time)),
			}

			// Find the distance between now and the count down date
			let distance = bufferTime.start.getTime() - metadata.currentTime.getTime()
			// Time calculations for hours and minutes
			let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
			let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
			let timer = `${hours}h ${minutes}m`

			let tests =
			{
				eventHasEnded: metadata.status === 1,
				eventIsOver: bufferTime.after < metadata.currentTime,
				doesEventEqualPresenceGame: bot.user.presence.game === (undefined || null) ? false : bot.user.presence.game.name === `[EVENT] ${metadata.event}`,
				presenceTypeIsPlaying: bot.user.presence.game === (undefined || null) ? false : bot.user.presence.game.type === 0,
				presenceGameIsNull: bot.user.presence.game == (undefined || null),
				eventDontRepeat: data.repeat_after === 0,
				eventIsHappening: bufferTime.start < metadata.currentTime && bufferTime.after > metadata.currentTime,
				eventHasntStarted: bufferTime.before < metadata.currentTime && bufferTime.start > metadata.currentTime
				
			}

			// watching = type 3
			// playing = type 0
			
			if (tests.eventHasEnded){
				return db.removeRowDataFromEventData(`name`, `'${metadata.event}'`, metadata.time)
			}			
			
			if (tests.eventIsOver) {
				eventEnded()
			} else if (tests.presenceGameIsNull) {
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
					return db.removeRowDataFromEventData(`name`, `'${metadata.event}'`, metadata.time)
				} : () =>
				{
					let diff = data.length - metadata.time
					return db.updateRowDataFromEventData(`start_time = ${metadata.time + data.length}, length = ${diff}`, `name = '${metadata.event}' AND start_time = ${metadata.time}` )
				}
				
				return logger.info(`[STATUS CHANGE] ${bot.user.username} is now set to null`)
			}

			function eventStartingIn() {
				bot.user.setActivity(`[EVENT] ${metadata.event} in ${timer}`, {
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
	}

	/**
     *  
     * Database table check & schema preparation
     * @setupDatabase
     */
	function setupDatabase() {

		db._query(`CREATE TABLE IF NOT EXISTS "halloween_rewards_pool" (
					'item_id'	INTEGER,
					'item_name'	TEXT,
					'item_alias'	TEXT,
					'type'	TEXT,
					'rarity'	INTEGER,
					'drop_rate'	REAL,
					'availability'	INTEGER DEFAULT 0
					)`
		)
		//	Reset whole server cooldown to false/zero.
		db.resetCooldown()

	}

	/**
     * 
     * Runs loop for Scare The Mascot.
     * @smtloop
     */
	async function stmloop() {
		await stm.eventloop()
	}


	async function removeFeaturedDailyPostLoop(){
		await fdp.loop()
	}

	/**
	 * schedules when to try and remove a limited Shop Role
	 */
	function removeLimShopRole(){
        cron.schedule(`0 1 */30 * * *`, retriveData() )
        async function retriveData(){
            let data = await db.retrieveTimeData
			if (!data) {
				data.forEach(element => {
					bot.members.get(element.user_id).removeRole(element.role_id)
				})
			}
        }
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

			// Remove featured daily post
			removeFeaturedDailyPostLoop()
		} else {

			/**
             *  Production server
             */
			logger.info(`${bot.user.username}up in production. (${bot.getBenchmark(process.hrtime(bot.startupInit))})`)
			bot.user.setStatus(`online`)
			bot.user.setActivity(null)
			

			setupDatabase()
			roleChange()
			autoStatus()
			// Scare the mascot
			stmloop()
			// Remove limited role module
			removeLimShopRole()

		}
	}

}
