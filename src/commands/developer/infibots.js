"use strict"
const axios = require(`axios`)
/**
 * 	Refreshing, send POST stats to infinitybots.gg site
 * 	@author klerikdust
 */
module.exports = {
  name: `infibots`,
  aliases: [],
  description: `Refreshing, send POST stats to infinitybots.gg site`,
  usage: `infibots`,
  permissionLevel: 4,
  multiUser: false,
  applicationCommand: false,
  messageCommand: true,
  server_specific: true,
  servers: [`577121315480272908`],
  async execute(client, reply, message, arg, locale) {
    const initTime = process.hrtime()
    const servers = (await client.shard.fetchClientValues(`guilds.cache.size`)).reduce((acc, guildCount) => acc + guildCount, 0)
    const shards = client.shard.count
    const shard_list = client.shard.ids
    const users = await client.shard.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))
    axios.post(
      `https://spider.infinitybots.gg/bots/stats`,
      {
        servers: servers,
        shard_list: shard_list,
        shards: shards,
        users: users
      },
      {
        headers: {
          "Authorization": process.env.INFINITYBOTS_TOKEN,
          'Content-Type': `application/json`,
        },
      }
    )
      .then(() => {
        return reply.send(locale(`INFINITY.REFRESHED`), {
          socket: {
            benchmark: client.getBenchmark(initTime)
          }
        })
      })
      .catch(error => {
        return reply.send(locale(`INFINITY.REFRESHED`), {
          socket: {
            benchmark: error.message
          }
        })
      })
  }
}