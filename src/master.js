const shardName = require(`./config/shardName.json`)
const express = require(`express`)
const logger = require(`./libs/logger`)
const { Webhook } = require(`@top-gg/sdk`)

/**
 *  Parse shard name for given shard id.
 *  @param {number} id
 *  @return {string}
 */
const getCustomShardId = (id) => {
    return `SHARD_ID:${id} | ${shardName[id]}`
}

module.exports = () => {
    const { ShardingManager } = require(`discord.js`)
    const manager = new ShardingManager(`./src/annie.js`, { token: process.env.TOKEN })
    const server = express()
    manager.on(`shardCreate`, shard => logger.info(`${getCustomShardId(shard.id)} successfully launched.`))
    manager.spawn()
    //  Vote event
    const rewardDistribution = async (userId) => {
        this.dblApi.postStats({
            serverCount: this.guilds.cache.size,
            shardId: this.shard.ids[0],
            shardCount: this.options.shardCount
        })
        const user = await this.users.fetch(userId)
        if (user) {
            this.db.updateInventory({
                itemId: 52, 
                userId: userId, 
                value: 5000, 
                distributeMultiAccounts: true
            })
            try {
                const artcoinsEmoji = await this.getEmoji('artcoins')
                user.send(`**Thanks for the voting, ${user.username}!** I've sent ${artcoinsEmoji}**5,000** to your inventory as the reward!`)
                this.logger.info(`Vote reward successfully sent to USER_ID:${userId}`)
            }
            catch(e) {
                this.logger.warn(`FAIL to DM USER_ID:${userId} on SHARD_ID:${this.shard.ids[0]} > ${e.stack}`)
            }
        }
    }
    const wh = new Webhook(process.env.DBLWEBHOOK_AUTH)
    server.post(`/dblwebhook`, wh.middleware(), (req, res) => {
        if (!req.vote) {
            res.status(200).send({ message: `Endpoint successfully tested` })
        }
        const userId = req.vote.user
        logger.info(`USER_ID:${userId} just voted!`)
        manager.broadcastEval(`(${rewardDistribution}).call(this, ${userId})`)
        res.status(200).send({ message: `Vote data successfully received.` })
    })
    server.listen(process.env.PORT, () => logger.info(`Server listening on PORT:${process.env.PORT}`))
}