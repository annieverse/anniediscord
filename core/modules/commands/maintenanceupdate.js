class MaintenanceUpdate {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async execute() {
        const { reply,db,meta:{author} } = this.stacks
        db(author.id).maintenanceUpdate
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