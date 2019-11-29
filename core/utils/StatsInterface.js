const Card = require(`./UILibrary/Cards`)
const Chart = require(`./UILibrary/DataChart`)
const moment = require(`moment`)

class StatsInterface {
	constructor(data) {
		this.currentTime = moment()
		this.data = data
		this.theme = data.theme.startsWith(`dark`) ? `dark` : `light`
		this.resource = this.data.resource
	}


	resourceMessageCode() {
		const load = parseInt(this.resource.avg)
		const msgcode = {
			"30": {color: `okay`, message: `Everything looks fine!`},
			"70": {color: `warn`, message: `It's getting warm here...`},
			"100": {color: `critical`, message: `Running out of resources!`}
		}

		return load < 20 ? msgcode[`30`] : load < 70 ? msgcode[`70`] : msgcode[`100`]
	}


	async build() {
		const statusCode = this.resourceMessageCode()
		const cardLayer = new Card({
			width: 500,
			height: 420,
			theme: this.theme,
			dataBarSize: `small-med`,
			primaryColor: statusCode.color
		})

		const chartLayer = await new Chart({
			width: 250,
			height: 150,
			labels: [`24h ago`, `18h ago`, `12h ago`, `6h ago`, `just now`],
			datasets: [...this.data.history, parseInt(this.resource.avg)],
			theme: this.theme,
			primaryColor: statusCode.color
		}).render()

		return cardLayer

		//	Create base card.
		.createBase({})

		//	Add two header title on left and right. With captions as well.
		.addTitle({main: `Performance`, caption: `At a glance report.`, align: `left`})
		.addTitle({main: this.currentTime.format(`h:mm a`), caption: this.currentTime.format(`MMMM Do YYYY`), align: `right`, inline: true})

		//	Percentage of current system load.
		.addContent({main: `${this.resource.avg.toFixed(2)} %`, caption: statusCode.message, size: `EXTRA-LARGE`, align: `right`, mainColor: `inherit`, captionColor: `inherit`, marginLeft: 200, marginTop: 110})
		//	Average load past the 24 hours.
		.addContent({img: chartLayer, marginLeft: 200, marginBottom: 130})

		//	Content separator.
		.createVerticalSeparator({margin: 30})

		//	Secondary information bars such as memory, cpu and ping.
		.createDataBar({content: `${this.resource.cpu.toFixed(2)} %`, label: `cpu usage`, contentColor: `inherit`, inline: true})
		.createDataBar({content: `${this.resource.memory.toFixed(2)} %`, label: `ram usage`, contentColor: `inherit`, inline: true})
		.createDataBar({content: `${Math.round(this.resource.ping)} ms`, label: `ping`, contentColor: `inherit`, inline: true, releaseHook: true})
		
		.ready()
	}

	async render() {
		const buildResult = await this.build()
		return buildResult.toBuffer()
	}

}

module.exports = StatsInterface