let config = {}

/**
 *  This will set the base exp that user will get.
 *  @default 10 - 15 exp
 *  @type {array}
 */
config.baseAmount = [10, 15]

/**
 *  This will set the base number for exp multiplier.
 *  @default 1
 *  @type {number}
 */
config.factor = 1

/**
 *  The base rewward when leveled up. Multiply the base based on user's level.
 *  @example [this.currencyRewardPerLevelUp * user.level = totalGainedReward]
 *  @default 35
 *  @type {number}
 */
config.currencyRewardPerLevelUp = 35

/**
 *  This will define the exp interval between the message to avoid spam.
 *  @default 30 seconds
 *  @type {number}
 */
config.cooldown = 30000

module.exports = config