module.exports = async function guildMemberUpdate(client, oldMember, newMember) {
    if (!newMember.guild.configs) return 
    //  Import configs
    let guild = newMember.guild
    let configs = guild.configs
    /**
     *  -------------------------------------------------------
     *  WELCOMER MODULE
     *  -------------------------------------------------------
     */
     if (configs.get(`WELCOMER_MODULE`).value) {
        // If the user still needs to complete the discord membership gate for this guild
        if (newMember.pending) return
        /**
         *  -------------------------------------------------------
         *  WELCOMER'S AUTOROLE MODULE
         *  -------------------------------------------------------
         */
        //  Skip role assignment if no roles are registered
        const welcomerRolesList = configs.get(`WELCOMER_ROLES`)
        if (welcomerRolesList.value.length <= 0) return
        for (let i=0; i<welcomerRolesList.value.length; i++) {
            const roleId = welcomerRolesList.value[i]
            //  Handle if role cannot be found due to deleted/invalid
            if (!guild.roles.cache.has(roleId)) continue
            newMember.roles.add(roleId)
        }
    }
}
