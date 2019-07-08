const filteringInventory = require(`../../utils/inventoryContainerManager`);
const GUI = require(`../../utils/inventoryInterface`);

/**
 * Main module
 * @Inventory Display user's inventory bag.
 */
class Inventory {
    constructor(Stacks) {
        this.author = Stacks.meta.author;
        this.stacks = Stacks;
    }

    /**
     *  Initialzer method
     */
    async execute() {
        const { code: {INVENTORY}, db, name, reply, emoji } = this.stacks;


        //  Returns if user is invalid
        if (!this.author) return reply(INVENTORY.INVALID_USER)
        //  Get user's inventory metadata
        let Inventory = await db(this.author.id).inventory;
        //  Cleaning up metadata
        let res = await filteringInventory(Inventory)
        //  Returns if user don't have any items
        if (!res.filter_alias_res) return reply(INVENTORY.EMPTY)
        

        //  Display result
        return reply(INVENTORY.FETCHING, {socket: [name(this.author.id)], simplified: true})
        .then(async load => {

            reply(INVENTORY.HEADER, {
                socket: [emoji(`AnnieWot`), name(this.author.id)],
                image: await GUI(res),
                prebuffer: true,
                simplified: true
            })
            load.delete();
        })
    }
}

module.exports.help = {
    start: Inventory,
    name: "inventory",
    aliases: [],
    description: `Views your inventory`,
    usage: `${require(`../../.data/environment.json`).prefix}inventory`,
    group: "General",
    public: true,
    required_usermetadata: true,
    multi_user: true
}