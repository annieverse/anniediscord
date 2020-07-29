/**
 * Handles Nitro booster color roles
 * @author Pan
 * @since 6.0.1
 */
class nitroColorManager {
    constructor(components) {
        this.db = components.bot.db
        this.guild = components.bot.guild_id
        this.emoji = components.reaction._emoji
    }

    /**
     * Tests if the users has the role already
     * @param {String} [role = id] 
     * @returns {Boolean}
     */
    userHasRole(role){
        return this.components.bot.guilds.get(this.guild).members.get(this.components.user.id).has(role)
    }

    /**
     * tests if the user is a server booster based on the boost role
     * @returns {Boolean}
     */
    userIsBooster(){
        return this.components.bot.guilds.get(this.guild).members.get(this.components.user.id).has(this.components.bot.nitro_role)
    }

    /**
     * Add's color to user based on selected color reaction
     */
    add(){
        if (!this.components.bot.booster_colors) return
        if (!this.userIsBooster()) return this.components.reaction.remove(this.components.user)
        let result = this.components.bot.booster_colors.filter(obj => {
            return obj.id === this.emoji.id
        })
        if (this.userHasRole(result[0].ROLE)) return
        this.components.bot.guilds.get(this.guild).members.get(this.components.user.id).addRole(result[0].ROLE)
    }

    /**
     * Remove's color to user based on selected color reaction
     */
    remove(){
        if (!this.components.bot.booster_colors) return
        let result = this.components.bot.booster_colors.filter(obj => {
            return obj.id === this.emoji.id
        })
        if (!this.userHasRole(result[0].ROLE)) return
        if (!this.userIsBooster()) return
        let roles = []
        for (let index = 0; index < this.components.bot.booster_colors.length; index++) {
            const element = this.components.bot.booster_colors[index]
            roles.push(element.ROLE)
        }
        this.components.bot.guilds.get(this.guild).members.get(this.components.user.id).removeRoles(roles)
    }
}

module.exports = nitroColorManager