module.exports = function DiscordError(client, e) {
    client.logger.warn(e)
    return client.logger.warn(`Ops, something went wrong > ${e}`)
}
