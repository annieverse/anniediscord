"use strict"
const bfd = require(`bfd-api-redux`)
/**
 * 	Refreshing, send POST stats to BFD site
 * 	@author klerikdust
 */
module.exports = {
    name: `bfd`,
    aliases: [],
    description: `Refreshing, send POST stats to BFD site`,
    usage: `bfd`,
    permissionLevel: 4,
    multiUser: false,
    applicationCommand: false,
    messageCommand: true,
    server_specific: true,
    servers: [`577121315480272908`],
    async execute(client, reply) {
        const initTime = process.hrtime()
        const bfdApi = new bfd(process.env.BFD_API_TOKEN, process.env.BFD_BOT_ID)
        client.shard.broadcastEval(client => client.guilds.cache.size)
        .then(results => {
          const totalServers = results.reduce((acc, count) => acc + count, 0)
          bfdApi.setServers(totalServers)
          .then(() => {
            return reply.send(`BFD stats has been refreshed in ${client.getBenchmark(initTime)}`)
          })
          .catch(error => {
            return reply.send(`Error occured while refreshing BFD stats.\n\`\`\`\n${error.message}\n\`\`\``)
          })
        })
    }
}