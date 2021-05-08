/**
 * Main controller for handling AutoResponder.
 * @param {object} [client={}] Current bot instance.
 * @param {object} [message={}] Target message instance.
 * @return {object|winston}
 */
module.exports = async (client, message) => {
    const controllerId = `[Controller.AutoResponder]`
    //  Reject if guild does not have any registered AR.
    const ars = await client.db.getAutoResponders(message.guild.id)
    if (ars.length <= 0) return 
    //  Reject if context doesn't match with guild's any registered ARs.
    const foundArs = ars.filter(ar => ar.trigger === message.content)
    if (foundArs.length <= 0) return 
    //  Handle if AR still cooldown.
    const { ar_id, response } = foundArs[0]
    const ARCooldownId = `AR_${ar_id}@${message.guild.id}`
    if (await client.isCooldown(ARCooldownId)) return
    client.setCooldown(ARCooldownId, 15)
    //  Send response and handle incase fail to send the response.
    return message.channel.send(response)
    .catch(e => client.logger.warn(`${controllerId} has failed to send AR_${ar_id} response in GUILD_ID:${message.guild.id} due to > ${e.message}`))
}
