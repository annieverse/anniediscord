const Command = require(`../../libs/commands`)
/**
 * Flips a coin
 * @author klerikdust
 */
class FlipCoin extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
	}

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, choice, bot:{locale:{FLIPCOIN}} }) {
		return reply(choice(FLIPCOIN.RESPONSES), {
			socket: [choice([`Heads`, `Tails`])]
		})
	}

}

module.exports.help={
	start: FlipCoin,
	name:`flipcoin`,
	aliases: [`cf`, `flipcoin`, `coinflip`],
	description: `Flips a coin`,
	usage: `flipcoin`,
	group: `Fun`,
	permissionLevel: 0,
	public: true,
	multiUser: false
}