module.exports = async (bot, oldPresence, newPresence) => {


    /**
     *  Statistic Card - User's Last Login
     * 
     *  #How this works:
     *  Record user last_login by their last offline presence. If presenceUpdate is occurred two times 
     *  under 2 minutes from the same user, then ignore the entry.
     * 
     *  #Idea to improve this framework:
     *  I wanted to store them in a "queue" model for performance reason but still unsure how to implement it.
     *  So like put the 5-10 users on first queue and run the query later. This also tend to
     *  reduce the need to call database api.
     *  
     */


    const moduleID = `PRESENCEUPDATE_${newPresence.id}` || `PRESENCEUPDATE_${oldPresence.id}`
    //  Return if current presence is not offline
    if (newPresence.presence.status != `offline`) return
    //  To avoid performance degradation, add cooling down time before accepting next request of the same user
    if (await bot.isCooldown(moduleID)) return
    //  2 minutes cooling down
    await bot.setCooldown(moduleID, 120)
    await bot.db.updateLastLogin(newPresence.id)

}