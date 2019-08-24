/**
 * What TODO:
 * Create a timer to let a user know how much time is left on a weekly event
 * 
 * ASK Me if you need help and ill help walkthrough
 * 
 */
const databaseManager = require(`../../utils/databaseManager.js`)

/**
 * Notes for me.
 * Static private/bound to class
 * get a value
 * set a value
 */
class weeklyEventTimer extends databaseManager {
	constructor(Stacks) {
		super()
		this.stacks = Stacks
	}

	/**
     * return the tables data
     */
	async data(){
		let data = await this.pullRowData(`event_data`, `'weekly'`, `category`)
		return data
	}

	getTime(time){
		let date = new Date(time)
		return date.getTime()
	}

	async countDown(data){
		console.log((await data).length)
		let currentTime = (new Date())
		// Find the distance between now and the count down date
		var distance = this.getTime((await data).length) - this.getTime(currentTime.valueOf())
		// Time calculations for days, hours, minutes and seconds
		var days = Math.floor(distance / (1000 * 60 * 60 * 24))
		var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
		var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
		let countDown = `The event __${(await data).name}__ ends in **${days}d ${hours}h ${minutes}m**`
		return countDown
	}

	/**
     * let data = await this.pullData('event_data')
     * This will pull all data from this table, acts like an array of objects
     * F.ex: data[0].name or data[1].name
     */
	async execute() {
		const {reply} = this.stacks
		if ((await this.data()) === (null || undefined)) return reply(`I'm sorry but no weekly event is recorded.`)
		reply(await this.countDown(this.data()))
	}
}

module.exports.help = {
	start: weeklyEventTimer,
	name: `weeklyevent`, // 
	aliases: [], 
	description: `check the time left on the weekly event`,
	usage: `weeklyevent`,
	group: `general`,
	public: false,
	require_usermetadata: false,
	multi_user: false
}