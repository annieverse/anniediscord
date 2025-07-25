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
    async execute(client, reply) {
        const initTime = process.hrtime()
        const servers = (await client.shard.fetchClientValues(`guilds.cache.size`)).reduce((acc, guildCount) => acc + guildCount, 0)
        const shards = client.shard.count
        axios.post(
          `https://spider.infinitybots.gg/bots/stats`,
          {
            servers: servers,
            shards: shards,
          },
          {
            headers: {
              "Authorization": process.env.INFINITYBOTS_TOKEN,
              'Content-Type': `application/json`,
            },
          }
        )
        .then(() => {
          return reply.send(`infinitybots.gg stats has been refreshed in ${client.getBenchmark(initTime)}`)
        })
        .catch(error => {
          return reply.send(`Error occured while refreshing infinitybots.gg stats.\n\`\`\`\n${error.message}\n\`\`\``)
        })
    }
}