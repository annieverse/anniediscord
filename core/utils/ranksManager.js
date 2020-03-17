/**
 * Managing ranks in AAU.
 * {ranksManager}
 */
class ranksManager {

	/**
     * Passing discord events.
     * @this.bot of Discord.Client
     * @this.message of message listener
     */  
	constructor(bot, message) {
		this.bot = bot
		this.message = message
	}

	/**
     * Get roles through discord's collection.
	 * Returns @everyone role if no role can be found by name
     * @r of role property
     */ 
	getRoles(r) {
		return (this.bot.guilds.get(this.message.guild.id).roles.find(n => n.name === r) ?
				this.bot.guilds.get(this.message.guild.id).roles.find(n => n.name === r) :
				this.bot.guilds.get(this.message.guild.id).roles.find( n => n.name === `@everyone`) )
	}

	/**
     * Check ranks based on given lvl.
     * @lv of user level
     */  
	ranksCheck(lv) {

		/**
    	 * Level gap between ranks
    	 * @cap
    	 */ 
		const cap = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 85, 100, 180]

		/**
    	 * Filtering nearest below given value of an array.
    	 * @array
		 * @val
     	 */ 
		const closestBelowLv = (array, val) => {
			return Math.max.apply(null,array.filter(function(v)
			{ return v <= val }))
		}
    
		/**
		 * Filtering below given value of an array.
		 * @array
		 * @val
    	 */ 
		const previousLvl = (array, val) => {
			return Math.max.apply(null,array.filter(function(v)
			{ return v < val }))
		}


		/**
    	 * Collection of available ranks.
    	 * @ranks
    	 */
		let ranks = {

			"0": this.getRoles(`Pencilician`),
			"5": this.getRoles(`Crayola Knight`),
			"10": this.getRoles(`Crayomancer`),
			"15": this.getRoles(`Brush Wizard`),
			"20": this.getRoles(`Sketch Summoner`),
			"25": this.getRoles(`Legendary Doodler`),
			"30": this.getRoles(`Artifice Master`),
			"35": this.getRoles(`Hellbound Painter`),
			"40": this.getRoles(`Pastel Paladin`),
			"45": this.getRoles(`Color Elementalist`),
			"50": this.getRoles(`Copic Crusader`),
			"60": this.getRoles(`Earthwork Alchemist`),
			"70": this.getRoles(`Canvas Conqueror`),
			"85": this.getRoles(`Fame Dweller`),
			"100": this.getRoles(`The Creator`),
			"180": this.getRoles(`Altered Pencilian`)

		}

		/**
		 * Assign the correct rank to a person
		 * @array 
		 * @val
		 */
		const rankJump = (array, val) => {
			
			let correctRank = ranks[(closestBelowLv(array, val)).toString()]
			
			function currentrank(values) {
				const {message} = values
				let currentrank
				message.member.roles.forEach((element) => {
					switch (element.name) {
						case correctRank.name:
						 	currentrank = element
						 	break
						case ranks[180].name:
							currentrank = element
							break
						case ranks[100].name:
							currentrank = element
							break
						case ranks[85].name:
							currentrank = element
							break
						case ranks[70].name:
							currentrank = element
							break
						case ranks[60].name:
							currentrank = element
							break
						case ranks[50].name:
							currentrank = element
							break
						case ranks[45].name:
							currentrank = element
							break
						case ranks[40].name:
							currentrank = element
							break
						case ranks[35].name:
							currentrank = element
							break
						case ranks[30].name:
							currentrank = element
							break
						case ranks[25].name:
							currentrank = element
							break
						case ranks[20].name:
							currentrank = element
							break
						case ranks[15].name:
							currentrank = element
							break
						case ranks[10].name:
							currentrank = element
							break
						case ranks[5].name:
							currentrank = element
							break
						case ranks[0].name:
							currentrank = element
							break
						default:
							break
						}
					})
				return currentrank
			}
			let wrongRank = currentrank(this)

			wrongRank == undefined ? wrongRank = ranks[0] : null
			let isWrongRank = wrongRank == undefined ? true : correctRank.name != wrongRank.name ? true : false
			let hasRank = this.message.member.roles.find(r => r.name == correctRank.name) == null ? false : true
			return { isWrongRank, wrongRank, correctRank, hasRank}
		}

		return {
			title: ranks[(closestBelowLv(cap, lv)).toString()].name,
			rank: ranks[(closestBelowLv(cap, lv)).toString()],
			prevrank: ranks[(previousLvl(cap, lv)).toString()],
			currentrank: ranks[lv.toString()],
			nexttorank: (lv-previousLvl(cap, lv)),
			lvlcap: cap,
			color: (ranks[(closestBelowLv(cap, lv)).toString()].hexColor).toString(),
			rankJump: rankJump(cap, lv).isWrongRank,
			wrongRank: rankJump(cap, lv).wrongRank,
			correctRank: rankJump(cap, lv).correctRank,
			hasRank: rankJump(cap, lv).hasRank
		} 

	}
}


module.exports = ranksManager