const Card = require(`./UILibrary/Cards`)

class StatsInterface {
	constructor() {
		this.card = new Card({
			width: 500,
			height: 400,
			theme:`dark`,
			dataBarSize: `small-med`
		})
	}


	get build() {
		return this.card

		//	Create base card with default corner radius.
		.createBase()

		//	Add two header title on left and right. With captions as well
		.addTitle({main: `Placeholder Left`, caption: `placeholder left caption.`, align: `left`})
		.addTitle({main: `Placeholder Right`, caption: `placeholder right caption.`, align: `right`, inline: true})

		//	Percentage of current system load
		.addContent({main: `10.8%`, caption: `this is content caption`, size: `extra-large`, align: `right`, marginLeft: 200, marginTop: 100})

		//	Secondary information bars such as memory, cpu and ping.
		.createDataBar({content: `12.7%`, label: `cpu usage`})
		.createDataBar({content: `18.1%`, label: `ram usage`})
		.createDataBar({content: `6.79%`, label: `ping`})

		.ready()
	}

	render() {
		return this.build.toBuffer()
	}

}

module.exports = StatsInterface