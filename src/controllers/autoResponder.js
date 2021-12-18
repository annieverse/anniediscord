/**
 * Main controller for handling AutoResponder.
 * @param {object} [client={}] Current bot instance.
 * @param {object} [message={}] Target message instance.
 * @return {object|winston}
 */
module.exports = async (client, message) => {
    //  Reject if guild does not have any registered AR.
    const ars = await client.db.getAutoResponders(message.guild.id)
    if (ars.length <= 0) return
    //  Reject if context doesn't match with guild's any registered ARs.
    const foundArs = ars.filter(ar => ar.trigger === message.content)
    if (foundArs.length <= 0) return
    //  15s cooldown to prevent spam
    const {
        ar_id,
        response
    } = foundArs[0]
    const cooldown = 15 // in seconds
    const ARCooldownId = `AR_${ar_id}@${message.guild.id}`
    if (client.cooldowns.has(ARCooldownId)) {
        const recentCooldown = client.cooldowns.get(ARCooldownId)
        const diff = cooldown - ((Date.now() - recentCooldown) / 1000)
        if (diff > 0) return
    }
    client.cooldowns.set(ARCooldownId, Date.now())
    //  Send response and handle incase fail to send the response.
    return message.channel.send(response)
        .catch(e => e)
}