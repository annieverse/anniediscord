const Card = require(`./UILibrary/Cards`)
const Typography = require(`./UILibrary/Typography`)

class StatsInterface {
	constructor() {
		this.card = new Card({color:`lightgray`})
	}


	render() {

		let data = new Typography(this.card.base, `nightmode`).addTitle(`Add Title`)

		return data.card.toBuffer()
	}

}

module.exports = StatsInterface