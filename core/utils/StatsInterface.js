const Card = require(`./UILibrary/Cards`)
const Chart = require(`./UILibrary/DataChart`)
const moment = require(`moment`)

class StatsInterface {
	constructor(data) {
		this.currentTime = moment()
		this.data = data
		this.theme = data.theme.startsWith(`dark`) ? `dark` : `light`
		this.resource = this.data.resource
		this.history = data.history
	}


	statusCode() {
		const ping = parseInt(this.resource.ping)
		const msgcode = {
			"100": {color: `okay`, message: `Everything looks fine!`},
			"500": {color: `warn`, message: `I'm getting tired.`},
			"1000": {color: `critical`, message: `Aw, unstable connection...`}
		}

		return ping < 100 ? msgcode[`100`] : ping < 500 ? msgcode[`500`] : msgcode[`1000`]
	}


	/**
	 * Used to format returned bytes value into more human-readable data.
	 * @param {Bytes/Number} bytes 
	 * @param {*} decimals 
	 */
	formatBytes(bytes, decimals = 2) {
		if (bytes === 0) return `0 Bytes`
	
		const k = 1024
		const dm = decimals < 0 ? 0 : decimals
		const sizes = [`Bytes`, `KB`, `MB`, `GB`, `TB`, `PB`, `EB`, `ZB`, `YB`]
	
		const i = Math.floor(Math.log(bytes) / Math.log(k))
	
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ` ` + sizes[i]
	}


	async build() {
		const uptime = moment.duration(this.resource.uptime)
		const statusCode = this.statusCode()
		const cardLayer = new Card({
			width: 500,
			height: 420,
			theme: this.theme,
			dataBarSize: `small-med`,
			primaryColor: statusCode.color
		})

		const chartLayer = await new Chart({
			width: 405,
			height: 150,
			labels: [`now`, ...(this.history.label).map(timestamp => moment(timestamp).format(`hh:mm`))],
			datasets: [this.resource.ping, ...this.history.datasets],
			theme: this.theme,
			primaryColor: statusCode.color
		}).render()

		return cardLayer

		//	Create base card.
		.createBase({})

		//	Add two header title on left and right. With captions as well.
		.addTitle({main: `System Metrics`, caption: `Response Time`, align: `left`})
		.addTitle({main: this.currentTime.format(`h:mm a`), caption: `${this.resource.ping} ms`, align: `right`, inline: true})

		//	Response Time Chart for the past 24 hours.
		.addContent({img: chartLayer})

		//	Content separator.
		.createVerticalSeparator({margin: 20})

		//	Secondary information bars.
		.createDataBar({content: this.resource.commandsRan, label: `commands ran`, contentColor: `inherit`, barColor: `main`, inline: true})
		.createDataBar({content: this.formatBytes(this.resource.memory), label: `ram usage`, contentColor: `inherit`, barColor: `main`, inline: true})
		.createDataBar({content: `${uptime.hours()}h ${uptime.minutes()}m`, label: `uptime`, contentColor: `inherit`, barColor: `main`, inline: true, releaseHook: true})
		
		.ready()
	}

	async render() {
		const buildResult = await this.build()
		return buildResult.toBuffer()
	}

}

module.exports = StatsInterface