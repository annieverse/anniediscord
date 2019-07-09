
/**
 * Main module
 * @oneClickEventJoin as shortcut of buying event ticket.
 */
class oneClickEventJoin {
    constructor(Stacks) {
        this.stacks = Stacks;
    }

    /**
     * Initializer method
     * @Execute
     */
    async execute() {
        const { db, eventLobby, palette, reply,
             code : {EVJOIN}, meta : { author, data }, 
             name, emoji, hasRole, addRole } = this.stacks;
        
        //  Centralized object
        let metadata = {
            ticket_fee: 250,
            ticket_name: `Event Participant`,
        }

        //  Returns if user already have the ticket.
        if (hasRole(metadata.ticket_name)) return reply(EVJOIN.ALREADY_HAS, {
            socket: [name(author.id)]
        })

        //  Returns if user's balance doesn't meet the requirement.
        if (data.artcoins < metadata.ticket_fee) return reply(EVJOIN.INSUFFICIENT_BALANCE)

        
        //  Deduct user's balance if user hadn't foxie card
        if (!data.foxie_card) db(author.id).withdraw(metadata.ticket_fee, `artcoins`)


        //  Assign role to user
        addRole(metadata.ticket_name)


        //  Finishing up
        return reply(EVJOIN.SUCCESSFUL, {
            socket: [
                name(author.id),
                data.foxie_card ? EVJOIN.FOXIES_BLESSING : ``,
                data.foxie_card ? emoji(`bongofoxy`) : ``,
            ],
            color: data.foxie_card ? palette.pink : palette.golden,
            notch: data.foxie_card ? true : false,
            field: eventLobby 
        })
    }
}
       
module.exports.help = {
    start: oneClickEventJoin,
    name:"event-join",
    aliases: ["join"],
    description: `allows you to submit to an event`,
    usage: `${require(`../../.data/environment.json`).prefix}join`,
    group: "Server",
    public: true,
    required_usermetadata: true,
    multi_user: false
}