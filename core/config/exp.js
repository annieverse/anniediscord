let config = {}

/**
 *  This will set the base exp that user will get.
 *  @DEFAULT 10 - 15 EXP
 *  @NUMBER
 */
config.totalGain = Math.round(Math.random() * (15 - 10 + 1)) + 10

/**
 *  This will set the base number for exp multiplier.
 *  @DEFAULT 1
 *  @NUMBER
 */
config.factor = 1

/**
 *  This will define the exp interval between the message to avoid spam.
 *  @DEFAULT 30 seconds
 *  @NUMBER
 */
config.cooldown = 30000

module.exports = config