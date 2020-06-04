let config = {}

/**
 *  This will define the point interval between the message to avoid spam.
 *  @default 30 seconds
 *  @type {number}
 */
config.cooldown = 30

/**
 *  -------------------
 *  EXP CONFIGURATIONS
 *  -------------------
 */
config.exp = {
	/**
	 *  This will set the base exp that user will get.
	 *  @default 10 - 15 exp
	 *  @type {array}
	 */
	baseAmount: [10, 15],

	/**
	 *  This will set the base number for exp multiplier.
	 *  @default 1
	 *  @type {number}
	 */
	factor: 1,

	/**
	 *  The base rewward when leveled up. Multiply the base based on user's level.
	 *  @example [this.currencyRewardPerLevelUp * user.level = totalGainedReward]
	 *  @default 35
	 *  @type {number}
	 */
	currencyRewardPerLevelUp: 35
}

/**
 *  -------------------
 *  CURRENCY CONFIGURATIONS
 *  -------------------
 */
config.currency = {
	/**
	 *  This will set the base artcoins that user will get.
	 *  @default 1 - 5 Artcoins
	 *  @type {array}
	 */
	baseAmount: [1, 5],

	/**
	 *  This will set the base number for currency multiplier.
	 *  @default 1
	 *  @type {number}
	 */
	factor: 1
}

module.exports = config