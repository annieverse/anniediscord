const db = require(`../../utils/databaseManager`)

class MaintenanceUpdate {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async execute() {
        const { reply } = this.stacks
        new db().maintenanceUpdate()
        reply(`Reward given`,{deleteIn:5000})
    }
}

module.exports.help = {
    start: MaintenanceUpdate,
    name: `maintenanceupdate`,
    aliases: [`maintenance`], 
    description: `gives ac to users for a maintenance break`,
    usage: `maintenance`,
    group: `Admin`,
    public: true,
    require_usermetadata: false,
    multi_user: false
}