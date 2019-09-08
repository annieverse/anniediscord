/*
 *This is only a template, easy to pull from when making a new command
 *
 */
class commandName {
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
    start: commandName,
    name: `maintenanceupdate`, // This MUST equal the filename
    aliases: [`maintenance`], // More or less this is what the user will input on discord to call the command
    description: `give ac to users for a maintance break`,
    usage: `maintenance`,
    group: `Admin`,
    public: true,
    require_usermetadata: false,
    multi_user: false
}