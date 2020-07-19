const Points = require(`./points`)
const commanifier = require((`../utils/commanifier`))
const moment = require(`moment`)

/**
 * @typedef {ExpData}
 * @property {number} [level] calculated level from given current exp
 * @property {number} [maxexp] calculated max cap exp from given current exp
 * @property {number} [nextexpcurve] calculated curve between min and max exp of current level
 * @property {number} [minexp] calculated lowest exp cap for current level
 */

/**
 * Sub module of Points. Handling exp systems
 * @author klerikdust
 * @since 6.0.0
 */
class Experience extends Points {
    constructor(client) {
        super(client)

        /**
         * The default multiplier will be `1` or equal to 100%.
         * @since 6.0.0
         * @type {number}
         */
        this.expMultiplier = this.expConfig.factor
    }

    /**
     *  Running EXP workflow.
     *  @param {number} [expToBeAdded=this.baseGainedExp] amount of exp to be added into user's current exp pool
     *  @returns {boolean}
     */
    async execute(expToBeAdded=this.baseGainedExp) {
    	this.exp = await this.db.getUserExp(this.message.author.id, this.message.guild.id)
		if (this.message.guild.id == `459891664182312980`) {
			let user = this.message.author
			let roles = []
			for (let index = 0; index < user.lastMessage.member._roles.length; index++) {
				const element = user.lastMessage.member._roles[index]
				roles.push(this.message.guild.roles.get(element).name)
			}
			let role, roleLevel
			for (let index = 0; index < this.bot.backupRanks.length; index++) {
				const element = this.bot.backupRanks[index].NAME
				for (let j = 0; j < roles.length; j++) {
					const element2 = roles[j]
					if (element == element2) {
						role = element
						roleLevel = this.bot.backupRanks[index].LEVEL
						break
					}
					if (role) break
				}
			}
			let xpToAdd = await this.xpReverseFormula(roleLevel)
			if (this.exp.current_exp < xpToAdd.maxexp) await this.db.addUserExp(Math.round(xpToAdd.maxexp), this.message.author.id, this.message.guild.id)
			if (!this.exp.current_exp) await this.db.setUserExp(Math.round(xpToAdd.maxexp), this.message.author.id, this.message.guild.id)
			if ((this.exp.current_exp < xpToAdd.maxexp) || !this.exp.current_exp) await this.db.forgivenessGift(this.message.author.id, this.message.guild.id, roleLevel)
		}
    	//  Apply booster if presents
    	if (this.exp.booster_id) await this.applyBooster()

    	//  Calculate and get detailed exp data
        this.totalGainedExp = expToBeAdded * this.expMultiplier
    	this.prevExp = this.xpFormula(this.exp.current_exp)
    	this.newExp = this.xpFormula(this.exp.current_exp + this.totalGainedExp)

    	//  Send level up message if new level is higher than previous level
    	if (this.newExp.level > this.prevExp.level) await this.levelUpPerks()

    	//  Update user's exp data.
    	await this.db.addUserExp(this.totalGainedExp, this.message.author.id, this.message.guild.id)
    	this.logger.info(`[Experience.execute()] [${this.message.guild.id}@${this.message.author.id}] has gained ${this.totalGainedExp}EXP(${this.expMultiplier * 100}%)`)
    	return true
    }

    /**
     *  Sum up booster effect to `this.expMultiplier`
     *  @returns {boolean}
     */
    async applyBooster() {
    	const fn = `[Experience.applyBooster()]`
    	const booster = await this.db.getItem(this.exp.booster_id)
    	const now = moment()

    	//  Handle if booster couldn't be fetched in the database
    	if (!booster) {
    		this.logger.error(`${fn} has failed to fetch booster item with id ${this.exp.booster_id}`)
    		return false
    	}

    	//  Handle if booster already expired
    	if (now.diff(this.exp.booster_actived_at, `minutes`) > booster.duration) {
    		await this.db.nullifyExpBooster(this.message.author.id)
    		return false
    	}

    	this.expMultiplier += booster.effect
    	return true
    }

    /**
     *  Sending level-up message and reward to the user.
     *  @type {replyObject}
     */
    async levelUpPerks() {
    	//  Handle level jumping (over 1 level threeshold)
    	const levelDiff = this.newExp.level - this.prevExp.level
    	if (levelDiff > 1) {
    		let stackedTotalGainedReward = 0
    		for (let i=0; i<levelDiff; i++) {
    			stackedTotalGainedReward += this.expConfig.currencyRewardPerLevelUp * (this.prevExp.level + i)
    		}
    		await this.db.updateInventory({itemId: 52, value: stackedTotalGainedReward, operation: `+`, userId: this.message.author.id, guildId: this.message.guild.id})
    		return this.reply(this.locale.LEVELUP.JUMPING, {
    			color: `purple`,
    			socket: {
    				user: this.message.author.username,
    				gainedLevel: `${this.newExp.level}(${levelDiff}+)`,
    				gainedReward: commanifier(stackedTotalGainedReward),
    				emoji: this.emoji(`artcoins`)
    			}
    		})
    	} 

    	//  Regular reward
    	const totalGainedReward = this.expConfig.currencyRewardPerLevelUp * this.newExp.level
    	await this.db.updateInventory({itemId: 52, value: totalGainedReward, operation: `+`, userId: this.message.author.id, guildId: this.message.guild.id})
		return this.reply(this.locale.LEVELUP.REGULAR, {
			color: `crimson`,
			socket: {
				user: this.message.author.username,
				gainedLevel: this.newExp.level,
				gainedReward: commanifier(totalGainedReward),
				emoji: this.emoji(`artcoins`)
			}
		})
    }

    /**
     *  Default EXP Calculation formula. Reversed.
     *  @param {ExpData} [data] the metadata to be calculated from.
     *  @author [sunnyrainyworks, fwubbles, the frying pan]
     *  @returns {ExpData}
     */
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
			var maxexp = Math.round(100 * (Math.pow(level + 1, 2)) + 50 * (level + 1) + 100)			
			var minexp = Math.round(100 * (Math.pow(level, 2)) + 50 * level + 100)
			var nextexpcurve = Math.round(maxexp - minexp)
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

    /**
     *  Default EXP Calculation formula.
     *  @param {number} [exp=0] the exp to be calculated from.
     *  @author [sunnyrainyworks, fwubbles, the frying pan]
     *  @returns {ExpData}
     */
	xpFormula(exp=0) {
		if (exp < 100) {
			return {
				level: 0,
				maxexp: 100,
				nextexpcurve: 100,
				minexp: 0
			}
		}
		var level = Math.sqrt(4 * exp - 375) / 20 - 0.25
		level = Math.floor(level)
		var maxexp = Math.round(100 * (Math.pow(level + 1, 2)) + 50 * (level + 1) + 100)
		var minexp = Math.round(100 * (Math.pow(level, 2)) + 50 * level + 100)
		var nextexpcurve = Math.round(maxexp - minexp)
		level = level + 1

		return {
			level: level,
			maxexp: maxexp,
			nextexpcurve: nextexpcurve,
			minexp: minexp
		}
    }

    /**
     *  Randomizing base gained user's exp using Point.randomizer() and defined value in `.src/config/exp.js`
     *  @type {number}
     */
    get baseGainedExp() {
    	const [min, max] = this.expConfig.baseAmount
    	return this.randomize(min, max)
    }

}

module.exports = Experience