/**
 *  Base class for giving out perks once user get Shining Rich Star role.
 *  @BoosterPerks
 */
class BoosterPerks {

    
    /**
     *  Wrapped parameters from guildMemberUpdate.js
     *  @param {Client} bot 
     *  @param {UserObject} oldUser 
     *  @param {UserObject} newUser
     */
    constructor({ bot, oldUser, newUser }) {
        this.logger = bot.logger
        this.db = bot.db.setUser(newUser.id)
        this.oldUser = oldUser
        this.newUser = newUser
    }
    
    
    /**
     *  Storing 50,000 Artcoins perk
     *  @artcoinsPack
     */
    artcoinsPack() {
        this.db.storeArtcoins(50000)
        this.logger.info(`${this.newUser.tag} has received 50,000 Artcoins Pack.`)
    }


    /**
     *  Giving out vip badge
     *  @vipBadge
     */
    vipBadge() {
        this.db._query(`UPDATE userbadges SET slot6 = "vip" WHERE userId = ?`, `run`, [this.newUser.id])
        this.logger.info(`${this.newUser.tag} has received VIP badge.`)
    }


}

module.exports = BoosterPerks