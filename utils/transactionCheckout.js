const { MessageCollector } = require(`discord.js`);


//  Await for user confirmation before proceeding the transaction.
class Checkout {
    constructor(itemdata, proc, msg, user, show_image = false,) {
        this.itemdata = itemdata;
        this.proc = proc;
        this.show_image = show_image;
        this.message = msg;
        this.author = user;
    }

    // Lowercase first letter and de-plural string.
    normalize(string) {
        string = string.charAt(0).toLowerCase() + string.slice(1);
        string = string.slice(0, -1);
        return string;
    }


    get collector() {
        return new MessageCollector(this.message.channel,
            m => m.author.id === this.author.id, {
                max: 1,
                time: 30000,
            });
    }


    async run() {
        this.collector.on(`collect`, async (msg) => {
            let user_input = msg.content.toLowerCase();

            // Transaction successful.
            if (user_input === `y`) {
                msg.delete();
                this.collector.stop();

                this.proc[this.itemdata.type](this.itemdata);
                this.proc.withdraw(this.itemdata.price, this.itemdata.price_type);
            }

            // Transaction failed.
            else {
                msg.delete();
                this.collector.stop();
                if (user_input !== `y`) return
                try {
                    //  Insufficient balance.
                    if (this.data[this.itemdata.price_type] < parseInt(this.itemdata.price)) return
                } catch (e) {
                    return
                }
            }
        })
    }
}

module.exports = Checkout;