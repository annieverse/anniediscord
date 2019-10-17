const Pistachio = require(`./Pistachio`)
/**
 *  Boilerplate for handling Booster Color Perks.
 *  @BoosterPerks
 */
class BoosterColorManager {

    
    /**
     *  Wrapped parameters from messageReaction-related events.
     */
    constructor(Components) {
		this.components = { 
			user: Components.user, 
			reaction: Components.reaction, 
			bot:Components.bot, 
            message:Components.reaction.message, 
            reaction: Components.reaction,
			meta: {author:null}
        },
        this.userGuild = Components.reaction.message.guild.members.get(Components.user.id)
        this.logger = Components.bot.logger
        this.colorList = {
            "col_grape_soda": "Grape Soda ♡",
            "col_purple_cake": "Purple Cake ♡",
            "col_blackberries": "Blackberries ♡",
            "col_raisins_pie": "Raisins Pie ♡",
            "col_cotton_candy": "Cotton Candy ♡",
            "col_pink_yogurt": "Pink Yogurt ♡",
            "col_raspberries": "Raspberries ♡",
            "col_gummy": "Gummy ♡",
            "col_pancake": "Pancake ♡",
            "col_butter_bread": "Butter Bread ♡",
            "col_biscuit": "Biscuit ♡",
            "col_lemon_syrup": "Lemon Syrup ♡",
            "col_minty_ice_cream": "Minty Ice Cream ♡",
            "col_green_tea": "Green Tea ♡",
            "col_jelly_bean": "Jelly Bean ♡",
            "col_pickles": "Pickles ♡",
            "col_bubble_gum": "Bubblegum ♡",
            "col_mineral_water": "Mineral Water ♡",
            "col_blueberries": "Blueberries ♡",
            "col_blue_cheese": "Blue Cheese ♡",
            "col_oreo": "Oreo ♡",
            "col_milkshake": "Milkshake ♡"
        }
        this.pistachio = new Pistachio(this.components).bag()
    }
    
    
    /**
     *  Check if user is a booster
     *  @userIsBooster
     */
    userIsBooster() {
        let hasRole = this.userGuild.roles.find(r => r.id === `585550404197285889`)
        if (!hasRole) {
            this.logger.info(`${this.components.user.username} can't pick custom color because they aren't Server Booster.`)
            return false
        }

        this.logger.info(`${this.components.user.username} is a Server Booster and trying to pick a custom color.`)
        return true
    }


    /**
     *  Fetching color data from guild.
     *  @param {String|EmojiName} roleName
     *  @fetchColorData
     */
    fetchColorData(roleName) {
        const roleData = this.components.message.guild.roles.find(r => r.name === roleName)
        return roleData ? roleData : false
    }


   /**
     *  Assigning color role to the user
     *  @param {Object|RoleData} colorData
     *  @assignColor
     */
    assignColor(colorData) {
        if (!colorData) return false

        this.userGuild.addRole(colorData.id)
        this.logger.info(`${this.components.user.username} has received ${colorData.name} from Booster Perks channel.`)
    }

    
    /**
     *  Revoking/removing color from user
     *  @param {Object|RoleData} colorData
     *  @userHasColor
     */
    revokeColor(colorData) {
        if (!colorData) return false

        this.userGuild.removeRole(colorData.id)
        this.logger.info(`${this.components.user.username} has revoked ${colorData.name} from Booster Perks channel.`)
    }


    /**
     *  Check if user already has the color or not.
     *  @param {Object|RoleData} colorData
     *  @userHasColor
     */
    userHasColor(colorData) {
        return this.userGuild.roles.has(colorData.id)
    }


    /**
     *  Sending message based of Pistachio's Reply to the user DM.
     *  @sendingDMNotification
     */
    sendingDMNotification(content = ``) {
        if (!content.length) return
        try {
            return this.pistachio.reply(content, {field: this.components.user})
        }
        catch (e) {
            return this.logger.error(`Failed to send DM to ${this.components.user.username}. > ${e.stack}`)
        }
    }



    /**
     *  Executing sequence for messageReactionAdd.js
     *  @Add
     */
    Add() {
        const colorData = this.fetchColorData(this.colorList[this.components.reaction.emoji.name])

        //  Notify user if non-booster user can't get Booster Perk's custom color


        try {
            //  Assign color and notify user.
            this.assignColor(colorData)
            return this.sendingDMNotification(`You've received **${colorData.name}** color! feel free to switch color whenever you like!`)
        }
        catch (e) {
            //  Incase there's an unexpected error
            this.logger.error(`Failed to assign ${colorData.name} color to ${this.components.user.username}(Server Booster). > ${e}`)
        }
    }


    /**
     *  Executing sequence for messageReactionRemove.js
     *  @Remove
     */
    Remove() {
        const colorData = this.fetchColorData(this.colorList[this.components.reaction.emoji.name])

        //  Skip color revoking if user doesn't have the color in the first place
        if (!this.userHasColor(colorData)) return

        try {
            //  Removing color from user
            this.revokeColor(colorData)
        }
        catch (e) {
            //  Incase there's an unexpected error
            this.logger.error(`Failed to revoke ${colorData.name} color from ${this.components.user.username}(Server Booster). > ${e}`)
        }
    }


}

module.exports = BoosterColorManager