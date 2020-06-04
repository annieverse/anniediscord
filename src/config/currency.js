let config = {}

/**
 *  This will set the base artcoins that user will get.
 *  @default 1 - 5 Artcoins
 *  @type {array}
 */
config.baseAmount = [1, 5]

/**
 *  This will set the base number for artcoins multiplier.
 *  @default 1
 *  @type {number}
 */
config.factor = 1

/**
 *  This will define the artcoins gain interval between the message to avoid spam.
 *  @default 30 seconds
 *  @type {number}
 */
config.cooldown = 30000

module.exports = config