/**
 * Main module
 * @Redeem redeeming lucky tickets.
 */
class Redeem {
    constructor(Stacks) {
        this.stacks = Stacks;
        this.ticket_price = 120;
        this.db = Stacks.db(Stacks.meta.author.id);
    }


    /**
     *  Initializer method
     */
    async execute() {
        const { args, commanifier, palette, emoji, trueInt, collector, reply, code: {REDEEM}, meta: {data} } = this.stacks;


        //  Returns as short-guide if user doesn't specify any parameters
        if (!args[0]) return reply(REDEEM.SHORT_GUIDE)


        //  Integer check. Also allowed to use <all> parameter
        let amount = args[0].startsWith(`all`) ? Math.floor(data.artcoins/this.ticket_price) : trueInt(args[0])
        //  Calculate price
        let price = amount * this.ticket_price;


        //  Returns if user inputted an invalid type of number
        if (!amount) return reply(REDEEM.INVALID_AMOUNT)
        //  Returns if user balance is below the calculated price.
        if (data.artcoins < price) return reply(REDEEM.INSUFFICIENT_BALANCE, {
            socket: [emoji(`artcoins`), commanifier(price - data.artcoins)]
        })


        //  Confirmation
        reply(REDEEM.CONFIRMATION, {
            socket: [emoji(`artcoins`), commanifier(price), emoji(`lucky_tickets`), commanifier(amount)],
            color: palette.golden,
            notch: true
        })
        .then(async confirmation => {
            collector.on(`collect`, async msg => {
                let input = msg.content.toLowerCase();

                //  Close connections
                confirmation.delete()
                collector.stop();
                msg.delete();


                //  Returns if user attempted to cancel the transaction
                if (!input.startsWith(`y`)) return reply(REDEEM.CANCELLED)


                //  Update Lucky Tickets
                await this.db.addLuckyTickets(amount)
                //  Withdraw artcoins
                await this.db.withdraw(price, `artcoins`)


                //  Redeem successful
                return reply(REDEEM.SUCCESSFUL, {
                    socket: [emoji(`lucky_tickets`), commanifier(amount)],
                    color: palette.lightgreen
                })

            })
        })
    }
}

module.exports.help = {
    start: Redeem,
    name: "redeem",
    aliases: [],
    description: `Buys gacha tickets`,
    usage: `${require(`../../.data/environment.json`).prefix}redeem <amount>`,
    group: "Shop-related",
    public: true,
    required_usermetadata: true,
    multi_user: false
}