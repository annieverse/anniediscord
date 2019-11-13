const PagingSystem = require(`../../utils/PagingSystem`)
const CardImgUrl = require(`../../utils/config/cardImageUrl`)


/**
 * Main module
 * @Cardpedia displaying droppable cards from Lucky Tickets.
 */
class Cardpedia {
	constructor(Stacks) {
		this.stacks = Stacks
	}
	async execute() {
        const { message } = this.stacks
        return new PagingSystem({message: message, data:Object.values(CardImgUrl)}).render()
	}
}


module.exports.help = {
	start: Cardpedia,
	name: `cardpedia`,
	aliases: [`cardped`, `cardpedia`],
	description: `displaying droppable cards from Lucky Tickets`,
	usage: `cardpedia`,
	group: `Server`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}