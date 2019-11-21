const GUI = require(`../../utils/levelcardInterface`)

/**
 * Main module
 * @Level Display detailed level information.
 */
class Level {
	constructor(Stacks) {
		this.stacks = Stacks
	}


	async textOpt(){
		const {meta:{ data }} = this.stacks
		const progress = ({
			value,
			length = 40,
			vmin = 0.0,
			vmax = 1.0,
			progressive = false
		}) => {
			// Block progression is 1/8
			const blocks = [``, `▏`, `▎`, `▍`, `▌`, `▋`, `▊`, `▉`, `█`]
			const lsep = `▏`, rsep = `▕`

			// Normalize value
			const normalized_value = (Math.min(Math.max(value, vmin), vmax) - vmin) / Number(vmax - vmin)
			const v = normalized_value * length
			const x = Math.floor(v) // integer part
			const y = v - x         // fractional part
			const i = Math.round(y * 8)
			const bar = Array(x).fill(`█`).join(``) + blocks[i]
			const remaining = Array(length - bar.length).fill(` `).join(``)
			return `${lsep}${bar}${!progressive ? remaining : ``}${rsep}  ${(Math.round(normalized_value * 100 * 100) / 100)}%`
		}
		let current = data.currentexp <= data.minexp ? 0 : (data.currentexp - data.minexp) / (data.nextexpcurve)
		let bar = progress({value: current, vmin: 0, vmax: 100})
		let level = data.level
		let currentexp = data.currentexp
		let nextlevelup = data.maxexp - data.currentexp
		return {bar,level,currentexp,nextlevelup}
	}

	/**
	 *  Initialzer method
	 */
	async execute() {
		const { reply, name, code: {LEVELCARD}, meta: {author}, command } = this.stacks

		//  Returns if user is invalid
		if (!author) return reply(LEVELCARD.INVALID_USER)

		let textoptions = await this.textOpt()
		
		//  Display result
		command.includes(`text`) || command.includes(`tex`) || command.includes(`t`) || command.includes(`tx`) ?
		reply(`${LEVELCARD.HEADER}\n${textoptions.bar}\n  ${textoptions.level}\t\t  ${textoptions.currentexp}\t\t\t${textoptions.nextlevelup}\nLevel\tCurrent Exp\tNext Level Up`, {
			socket: [name(author.id)],
			simplified: true 
		}) :
		reply(LEVELCARD.HEADER, {
			socket: [name(author.id)],
			image: await GUI(this.stacks, author),
			prebuffer: true,
			simplified: true
		})
	}
}

module.exports.help = {
	start: Level,
	name: `level`,
	aliases: [`lvl`, `lv`, `leveltext`, `lvltext`, `lvtext`, `levelt`, `lvlt`, `lvt`, `leveltx`, `lvltx`, `lvtx`, `leveltex`, `lvltex`, `lvtex`],
	description: `Pulls up your level`,
	usage: `level`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}