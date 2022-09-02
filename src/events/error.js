module.exports = function DiscordError(client, e) {
    return client.logger.warn(`Ops, something went wrong > ${e}`)
}
