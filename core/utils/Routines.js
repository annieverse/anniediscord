const cron = require(`node-cron`)
const moment = require(`moment`)
const { Attachment } = require(`discord.js`)
const getCpuUsage = require(`./cpuUsage`)
const getMemUsage = require(`./memoryUsage`)
const dailyFeatured = require(`../utils/DailyFeaturedPost`)


/**
 *  Please only add new method if it intentionally used for scheduled task like in ready.js
 *  @param {Object} Client current this.client instance
 */
class Routines {
    constructor(Client = {}) {
        this.client = Client
        this.logger = Client.logger
        this.db = Client.db
        this.env = Client.env
    }


    databaseCheck() {

        this.db._query(`CREATE TABLE IF NOT EXISTS resource_usage (
            'timestamp' INTEGER,
            'environment' TEXT,
            'uptime' INTEGER,
            'ping' REAL,
            'cpu' REAL,
            'memory' REAL)`
            , `run`
            , []
        )
    
        this.db._query(`CREATE TABLE IF NOT EXISTS commands_usage (
            'timestamp' INTEGER,
            'guild_id' TEXT,
            'user_id' TEXT,
            'command_alias' TEXT,
            'resolved_in' TEXT)`
            , `run`
            , []
        )
    
    }


	/**
	 * 	Automatically backup the current state of the database to #database-snapshots channel.
	 * 	This will run every at 12 AM everyday.
	 * 
	 * 	@backupDatabase
	 */
	databaseBackup() {
		cron.schedule(`0 0 0 * * *`, () => {
            const timestamp = Date.now()
			this.client.guilds.get(`577121315480272908`).channels.get(`654401729663860739`).send(
				moment(timestamp.format(`dddd, MMMM Do YYYY, h:mm:ss a`)),
				new Attachment(`.data/database.sqlite`, `${timestamp}.sqlite`)
            )
            this.logger.info(`Database with timestamp [${timestamp}] has been backed up.`)
		})
	}


    /**
     * Change color of role
     * @roleChange
     */
	roleChange() {
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
		function autoRoleColorChange(roleNameInput){

			/**
             * Pass through the role's name and it will return the role object
             * @param {string} role 
             * @returns {object} Role Object
             */
			async function grabRole(role){
				return this.client.guilds.get(`459891664182312980`).roles.find(n => n.id === role)
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
				this.logger.info(`The color for "${role.name}" has been changed to "${color}" from "${role.hexColor}"`)
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
     *  Automatically change current this.client status presence
     *  @autoStatus
     */
	autoStatus() {
		let x = 1 // number of minutes

		update()
		setInterval(update, 60000 * x)

		async function update(){

			let data = await this.db.pullEventData(`event_data`)
			
			if (data[0] === undefined) {
				if (this.env.dev) {
					return this.client.user.setActivity(`maintenance.`, {
						type: `LISTENING`
					})
				} else {
					return this.client.user.setActivity(null)
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
				doesEventEqualPresenceGame: this.client.user.presence.game === (undefined || null) ? false : this.client.user.presence.game.name === `[EVENT] ${metadata.event}`,
				presenceTypeIsPlaying: this.client.user.presence.game === (undefined || null) ? false : this.client.user.presence.game.type === 0,
				presenceGameIsNull: this.client.user.presence.game == (undefined || null),
				eventDontRepeat: data.repeat_after === 0,
				eventIsHappening: bufferTime.start < metadata.currentTime && bufferTime.after > metadata.currentTime,
				eventHasntStarted: bufferTime.before < metadata.currentTime && bufferTime.start > metadata.currentTime
				
			}

			// watching = type 3
			// playing = type 0
			
			if (tests.eventHasEnded){
				return this.db.removeRowDataFromEventData(`name`, `'${metadata.event}'`, metadata.time)
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
				this.env.dev ? ()=>
				{
					this.client.user.setStatus(`dnd`)
					this.client.user.setActivity(`maintenance.`, {
						type: `LISTENING`
					})
				} : () => 
				{
					this.client.user.setStatus(`online`)
					this.client.user.setActivity(null)
				}
				
				tests.eventDontRepeat? ()=>{
					this.db.updateEventDataActiveToOne(`${metadata.event}`, metadata.time)
					return this.db.removeRowDataFromEventData(`name`, `'${metadata.event}'`, metadata.time)
				} : () =>
				{
					let diff = data.length - metadata.time
					return this.db.updateRowDataFromEventData(`start_time = ${metadata.time + data.length}, length = ${diff}`, `name = '${metadata.event}' AND start_time = ${metadata.time}` )
				}
				
				return this.logger.info(`[STATUS CHANGE] ${this.client.user.username} is now set to null`)
			}

			function eventStartingIn() {
				this.client.user.setActivity(`[EVENT] ${metadata.event} in ${timer}`, {
					type: `WATCHING`
				})
				return  this.logger.info(`[STATUS CHANGE] ${this.client.user.username} is now WATCHING ${metadata.event}`)
			}

			function eventGoing() {
				this.client.user.setActivity(`[EVENT] ${metadata.event}`, {
					type: `PLAYING`
				})
				return  this.logger.info(`[STATUS CHANGE] ${this.client.user.username} is now PLAYING ${metadata.event}`)
			}
		}
    }
    

    /**
     *  Automatically record resource usage data every 5 min.
     *  @resourceUsageLogging
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
                record()
            }, null)
        }, 60000*x)

        /**
         * 	Note: the available data to be stored currently only covered the necessary ones.
         * 	More new different kind of data will be recorded in the future.
         */
        function record() {
            let params = [this.env.dev ? `development` : `production`, this.client.uptime, this.client.ping, getCpuUsage(), getMemUsage()]
            
            this.db._query(`
                INSERT INTO resource_usage(timestamp, environment, uptime, ping, cpu, memory)
                VALUES(datetime('now'), ?, ?, ?, ?, ?)`
                , `run`
                , params
            )

            this.logger.info(`Resource usage has been recorded.`)
        }
    }


    async removeFeaturedDailyPostLoop() {
        let fdp = new dailyFeatured(this.client)
        await fdp.loop()
    }

}

module.exports = Routines