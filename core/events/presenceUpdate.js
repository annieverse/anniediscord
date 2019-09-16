module.exports = async ({bot, newMember}) => {


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


    //  Return if current presence is not offline
    if (newMember.presence.status != 'offline') return

    const { db, keyv } = bot
    const user = await db.validateUser(newMember.id)

    //  Also return if user is not registered in db
    if (!user) return
    //  To avoid performance degradation, add cooling down time before accepting next request of the same user
    if (await keyv.get(`presenceUpdate-${newMember.id}`)) return

    const Now = Date.now()

    //  2 minutes cooling down
    await keyv.set(`presenceUpdate-${newMember.id}`, 1, 120000)
    await db.updateLastLogin(Now, newMember.id)
    
    bot.logger.info(`${newMember.user.tag} has logged out. (Timestamp: ${Now})`)
}