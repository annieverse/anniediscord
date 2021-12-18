/**
 * Handles Nitro booster roles
 * @author Pan
 * @since 6.0.1
 */
class nitroPerks {
    constructor(client) {
        this.db = client.db
        this.guild = client.guild_id
    }

    /**
     * Add's vip badge to those who boost the the server
     */
    async vipBadge(){
        await this.db.updateInventory({itemId: 128, value: 1, operation: `+`, userId: this.client.newUser.author.id, guildId: this.guild})
    }

    /**
     * Grabs server's amount that they want given to those who boost the server
     */
    async artcoinsPack(){
        let totalGainedCurrency = this.client.vip_artcoin_package
        await this.db.updateInventory({itemId: 52, value: totalGainedCurrency, operation: `+`, userId: this.client.newUser.author.id, guildId: this.guild})
    }
}

module.exports = nitroPerks