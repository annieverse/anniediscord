const Points = require(`./points`)
/**
 * Sub module of Points. Handling exp systems
 * @since 6.0.0
 */
class Experience extends Points {
    constructor() {
        super()
    }

	xpFormula(exp){
		if (exp < 100) {
			return {
				level: 0,
				maxexp: 100,
				nextexpcurve: 100,
				minexp: 0
			}
		}

		//exp = 100 * (Math.pow(level, 2)) + 50 * level + 100
		//lvl = Math.sqrt(4 * exp - 375) / 20 - 0.25
		var level = Math.sqrt(4 * exp - 375) / 20 - 0.25
		level = Math.floor(level)
		var maxexp = 100 * (Math.pow(level + 1, 2)) + 50 * (level + 1) + 100
		var minexp = 100 * (Math.pow(level, 2)) + 50 * level + 100
		var nextexpcurve = maxexp - minexp
		level = level + 1

		return {
			level: level,
			maxexp: maxexp,
			nextexpcurve: nextexpcurve,
			minexp: minexp
		}
    }
    
	async xpReverseFormula(data) {
		const formula = (level) => {
			
			if (level < 1) {
				return {
					level: 0,
					maxexp: 100,
					nextexpcurve: 100,
					minexp: 0
				}
			}
			level < 60 ? level-=1 : level+=0
			let exp = Math.floor(((390.0625*(Math.pow(level+1, 2)))+375)/4)
			//lvl = Math.sqrt(4 * exp - 375) / 20 - 0.25
			level = Math.sqrt(4 * exp - 375) / 20 - 0.25
			level = Math.floor(level)
			var maxexp = 100 * (Math.pow(level + 1, 2)) + 50 * (level + 1) + 100
			var minexp = 100 * (Math.pow(level, 2)) + 50 * level + 100
			var nextexpcurve = maxexp - minexp
			level = level + 1

			return {
				maxexp: maxexp,
				nextexpcurve: nextexpcurve,
				minexp: minexp,
				level: level
			}
		}

		let level = Math.floor(data)
		const main = formula(level)
		
		let maxexp = main.maxexp
		let nextexpcurve = main.nextexpcurve
		let minexp = main.minexp
		level = main.level
		return { level, maxexp, nextexpcurve, minexp }
	}
}

module.exports = Experience