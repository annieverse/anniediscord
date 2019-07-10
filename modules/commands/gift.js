/**
 * Main module
 * @Gift Sending gift to other user.
 */
class Gift {
    constructor(Stacks) {
        this.author = Stacks.meta.author;
        this.data = Stacks.meta.data;
        this.stacks = Stacks;
        this.repmeta = {
            rose: 1,
            chocolate_bar: 1,
            chocolate_box: 3,
            teddy_bear: 5,
        }
    }


    /**
     *  Get sender's author object and inventory metadata.
     */
    async assignSenderMetadata() {
        const { reqData } = this.stacks;
        const res = await reqData();
        this.senderMeta = res;
    }


    /**
     *  Initializer method
     */
    async execute() {
        const { code: {GIFT}, args, palette, emoji, name, reply, db, collector, trueInt, selfTargeting, parsingAvailableGifts } = this.stacks;
        
        //  Centralized data
        let metadata = {}

        // Get sender's inventory metadata
        await this.assignSenderMetadata();

        // No parameters given
        if (!args[0]) return reply(GIFT.SHORT_GUIDE, {socket: emoji(`HeartPeek`)});

        // Invalid target
        if (!this.author) return reply(GIFT.INVALID_USER);

        // Returns if user trying to gift themselves.
        if (selfTargeting) return reply(GIFT.SELF_TARGETING);


        //  Init
        reply(GIFT.FETCHING, {simplified: true})
        .then(async load => {
            let parsingResult = parsingAvailableGifts(this.repmeta, this.senderMeta.data)
            load.delete();
            
            //  Returns if user don't have any gifts to send
            if (!parsingResult) return reply(GIFT.UNAVAILABLE)
            
            reply(parsingResult, {notch: true, color: palette.golden})
            .then(async inventory => {
                //  Listening to item confirmation
                collector.on(`collect`, async msg => {
                    inventory.delete();

                    const input = msg.content.toLowerCase()
                    const params = input.split(` `)

                    
                    //  Get amount of gift to send from first parameter
                    metadata.amount_to_send = trueInt(params[0])
                    //  Get type of item to send from second parameter. Ignoring spaces.
                    metadata.item_to_send = input.slice(input.indexOf(params[1])).replace(/\ /g, "_");
                    //  Total gained reps from given properties above
                    metadata.counted_reps = this.repmeta[metadata.item_to_send] * metadata.amount_to_send;

                    
                    //  Returns if user amount input is lower than owned items
                    if (metadata.amount_to_send > this.senderMeta.data[metadata.item_to_send]) return reply(GIFT.INSUFFICIENT_AMOUNT)
                    //  Returns if user item name input is invalid
                    if (!this.senderMeta.data[metadata.item_to_send]) return reply(GIFT.INVALID_ITEM)
                    //  Returns if format is invalid
                    if (!metadata.amount_to_send && !metadata.item_to_send) return reply(GIFT.INVALID_FORMAT)


                    //  Closing the connections
                    collector.stop()


                    //  Send reputation points
                    db(this.author.id).addReputations(metadata.counted_reps)
                    //  Withdraw sender's gifts
                    db(this.senderMeta.author.id).withdraw(metadata.amount_to_send, metadata.item_to_send)

                    
                    //  Gifting successful
                    return reply(GIFT.SUCCESSFUL, {
                        socket: [
                            name(this.author.id),
                            emoji(metadata.item_to_send),
                            metadata.amount_to_send,
                            metadata.item_to_send,
                            metadata.counted_reps
                        ],
                        color: palette.lightgreen
                    })

                })
            })
        })
    }
}

module.exports.help = {
    start: Gift,
    name: "gift",
    aliases: [],
    description: `gives an item from your inventory to a specified user`,
    usage: `${require(`../../.data/environment.json`).prefix}gift @user`,
    group: "General",
    public: true,
    required_usermetadata: true,
    multi_user: true
}