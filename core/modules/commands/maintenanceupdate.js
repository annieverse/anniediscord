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
    name: `maintenanceUpdate`, 
    aliases: [`maintenance`], 
    description: `give ac to users for a maintance break`,
    usage: `maintenance`,
    group: `Admin`,
    public: true,
    require_usermetadata: false,
    multi_user: false
}