let config = {}

/**
 *  This will set the base artcoins that user will get.
 *  @DEFAULT 1 - 5 Artcoins
 *  @NUMBER
 */
config.totalGain = Math.round(Math.random() * (6 - 1 + 1)) + 1

/**
 *  This will set the base number for artcoins multiplier.
 *  @DEFAULT 1
 *  @NUMBER
 */
config.factor = 1

/**
 *  This will define the artcoins gain interval between the message to avoid spam.
 *  @DEFAULT 30 seconds
 *  @NUMBER
 */
config.cooldown = 30000

module.exports = config