const { Canvas } = require("canvas-constructor"); 
const { resolve, join } = require("path");
const { Attachment } = require("discord.js"); 
const Discord = require("discord.js");
const formatManager = require('../../utils/formatManager');
const profileManager = require('../../utils/profileManager');


const sql = require('sqlite');
sql.open('.data/database.sqlite');

Canvas.registerFont(resolve(join(__dirname, "../../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../../fonts/roboto-bold.ttf")), "RobotoBold");
Canvas.registerFont(resolve(join(__dirname, "../../fonts/roboto-thin.ttf")), "RobotoThin");
Canvas.registerFont(resolve(join(__dirname, "../../fonts/Whitney.otf")), "Whitney");

class inventory {
    constructor(Stacks) {
        this.author = Stacks.meta.author;
        this.data = Stacks.meta.data;
        this.utils = Stacks.utils;
        this.message = Stacks.message;
        this.args = Stacks.args;
        this.palette = Stacks.palette;
        this.stacks = Stacks;
    }

    async execute() {
        // Add these three lines so u dont have to go through and put this./this.stacks infront of everything
        // might have to go through if another varible is called
        let message = this.message;
        let bot = this.stacks.bot;
        let palette = this.stacks.palette;
        const configFormat = new formatManager(message);

        /**
            Requesting user inventory data from sql API.
            @get_inventobject
        */
        let raw_object;
        function get_inventobject() {
            let user = message.author;
            return sql.get(`SELECT  * FROM userinventories WHERE userId = "${user.id}"`)
                .then(async res => raw_object = res)
        }




        /**
            Parse raw_object (also referenced as container)
            @filtering_items
        */
        let filter_res, filter_alias_res, filter_rarity_res;
        async function filtering_items(container) {
            let bag = {}, parsedbag = {}, raritybag = {}, msg = "";
            const format = new formatManager(message);

            console.log(container);
            delete container.userId;
            console.log(container);

            //  Check whether the container is empty or filled.
            const empty_bag = () => {
                for (let i in container) {
                    if (container[i] !== null || container[i] > 0) return false;
                }
                return true;
            }


            //  Register all properties and values from container to be used in variable bag
            const assigning_items = () => {
                for (let i in container) {
                    if (i) { bag[i] = container[i] }
                }
            }


            //  Remove property that contain null values from an object
            const eliminate_nulls = () => {
                for (let i in bag) {
                    if (bag[i] === null || bag[i] === undefined || bag[i] < 1) { delete bag[i] }
                }
            }




            // Label each item from itemlist
            const name_labeling = () => {
                for (let i in bag) {
                    sql.get(`SELECT name FROM itemlist WHERE alias = "${i}"`)
                        .then(async data => parsedbag[data.name] = bag[i])
                }
            }


            // Store rarity of the item.
            const get_rarities = () => {
                for (let i in bag) {
                    sql.get(`SELECT rarity FROM itemlist WHERE alias = "${i}"`)
                        .then(async data => raritybag[i] = data.rarity)
                }
            }




            //  Sorting object in a descending order.
            const sort_order = (obj, saveopt, sortopt = {}) => {
                let temp_array = [], sorted_obj = {};

                // Push into an array with sub array.
                for (let i in obj) {
                    temp_array.push([[i], sortopt[i]]);
                }

                // Sort.
                temp_array.sort((a, b) => b[1] - a[1]);


                // Reassign to object form
                for (let i in temp_array) {
                    sorted_obj[temp_array[i][0]] = obj[temp_array[i][0]];
                }

                return saveopt < 1 ? bag = sorted_obj : parsedbag = sorted_obj;
            }




            // Parse & prettify items object so it can be displayed to the user.
            const formatting = () => {
                for (let i in parsedbag) {
                    msg += `[${format.threeDigitsComa(parsedbag[i])}x] ${i}\n`;
                }
                msg = `\`\`\`json\n${msg}\n\`\`\``;
            }


            if (empty_bag()) return filter_res = `\`\`\`json\n${message.author.username} has an empty bag.\n\`\`\``;

            // Cleaning the bag.
            assigning_items();
            eliminate_nulls();
            name_labeling();
            await utils.pause(100)
            get_rarities();
            await utils.pause(50);


            // Sorted and properly formatted.
            sort_order(bag, 0, raritybag);
            sort_order(parsedbag, 1, raritybag);
            formatting();


            filter_res = msg
            filter_alias_res = bag;
            filter_rarity_res = raritybag;
        }


        /**
            Inventory graphic built with canvas.
            @visual_interface
        */
        async function visual_interface(itemsdata) {
            const configProfile = new profileManager();


            let canvas_x = 580;
            let canvas_y = 250;
            let startPos_x = 10;
            let startPos_y = 15;


            let canv = new Canvas(canvas_x, canvas_y) // x y




            // Render the base for card.
            function card_base() {
                canv.setShadowColor("rgba(28, 28, 28, 1)")
                    .setShadowOffsetY(7)
                    .setShadowBlur(15)
                    .setColor(palette.darkmatte)

                    .addRect(startPos_x + 15, startPos_y + 10, canvas_x - 45, canvas_y - 45)
                    .createBeveledClip(startPos_x, startPos_y, canvas_x - 20, canvas_y - 20, 15)
                    .setShadowBlur(0)
                    .setShadowOffsetY(0)
                    .setColor(palette.nightmode)
                    .addRect(startPos_x, startPos_y, canvas_x, canvas_y)
                    //.addImage(avatar, startPos_x-100, startPos_y, 400, 164 * (400/164), 250)
                    .addRect(startPos_x + 150, startPos_y, canvas_x, canvas_y)
                    .restore()
            }



            // Get the item alias from global_assets_referrence.
            async function asset_id(itemname) {
                return sql.get(`SELECT asset_id FROM global_assets_referrence WHERE item_name = "${itemname}"`)
                    .then(async data => data.asset_id)
            }





            // Load the item asset.
            async function load_asset(id) {
                try {
                    const code = await asset_id(id);
                    return configProfile.getAsset(code);
                }
                catch (e) {
                    console.log(e)
                }
            }




            /**
                Scalable grid-system
                Allows each item to be stored on its own grid.
                @grid       
            */
            async function grid(x, y, dx, dy, collimit) {
                let i, curindex, temporary_y;


                //  Define value for each column break.
                const colbreak_value = () => {
                    let arr = [];
                    for (i = 1; i < 4; i++) {
                        arr.push(collimit * i);
                    }
                    return arr;
                }


                let colbreak = colbreak_value();


                //  Blank rectangle behind the item.
                const blankgrid = () => {
                    canv.setColor(palette.deepnight)
                    for (i = 0; i < colbreak[0]; i++) {
                        canv.addRect(x + (dx * i) + (5 * i), y, dx, dy);
                        canv.addRect(x + (dx * i) + (5 * i), y + (dx + 5), dx, dy);
                        canv.addRect(x + (dx * i) + (5 * i), y + ((dx * 2) + 10), dx, dy);
                    }
                }



                //  Shows quantities of the item.
                const quantity_grid = () => {
                    i = 0, curindex = 0;
                    for (let key in itemsdata) {

                        // if iteration hitting a value in columnbreak, reset iteration to zero.
                        // so y position can be adjusted based on defined row.
                        if (colbreak.includes(i)) i = 0;
                        let row_pos = curindex < colbreak[0] ? y + 65 : curindex < colbreak[1] ? (y + 65) + (dx + 5) : (y + 65) + ((dx * 2) + 10);
                        let col_pos = (x + 65) + ((dx + 5) * i);

                        // Stroke
                        canv.setTextAlign("right")
                        canv.setTextFont(`12pt RobotoBold`)
                        canv.context.strokeStyle = 'black';
                        canv.context.lineWidth = 2;
                        canv.context.strokeText(itemsdata[key], col_pos, row_pos);

                        //White text layer
                        canv.setColor(palette.white)
                            .addText(itemsdata[key], col_pos, row_pos)

                        curindex++
                        i++
                    }
                }



                // Visualize item
                const icon_grid = async () => {
                    i = 0, curindex = 0, temporary_y = y;
                    for (let key in itemsdata) {


                        // checkpoints
                        canv.save();
                        canv.save();



                        // if iteration hitting a value in columnbreak, reset iteration to zero.
                        // so y position can be adjusted based on defined row.
                        if (colbreak.includes(i)) i = 0;
                        let distancey = curindex < colbreak[0] ? y : curindex < colbreak[1] ? y + (dx + 5) : y + ((dx * 2) + 10);
                        let distancex = x + ((dx + 5) * i);
                        temporary_y = curindex < colbreak[0] ? y : curindex < colbreak[1] ? y + (dx + 5) : y + ((dx + 5) * 2);




                        // temporary object
                        const rarity_color = {
                            "1": palette.blankgray,
                            "2": palette.blankgray,
                            "3": palette.blue,
                            "4": palette.purple,
                            "5": palette.red,
                        };


                        // icon frame
                        canv.setColor(rarity_color[filter_rarity_res[key]])
                            .createBeveledClip(x + (dx * i) + (5 * i), temporary_y, dx, dy, 20)
                            .addRect(x + (dx * i) + (5 * i), temporary_y, dx, dy)
                            .restore()


                            // Framehole
                            .setColor(palette.deepnight)
                            .createBeveledClip((x + 3) + (dx * i) + (5 * i), temporary_y + 3, dx - 6, dy - 6, 20)
                            .addRect((x + 3) + (dx * i) + (5 * i), temporary_y + 3, dx - 6, dy - 6)



                            // the actual icon
                            .addImage(await load_asset(key), distancex, distancey, 70, 70, 35)
                            .restore()
                        curindex++
                        i++
                    }
                }


                // render each parts.
                card_base();
                await blankgrid();
                await icon_grid();
                await quantity_grid()

            }



            await grid(startPos_x + 20, startPos_y + 5, 70, 70, 7);
            return canv.toBuffer();
        }




        /**
            Displayed items quantity & name.
            @text_interface
        */
        function text_interface(content) {
            const embed = new Discord.RichEmbed()
                .setColor(palette.crimson)
                .setDescription(content)
            return message.channel.send(embed);
        }




        /**
            Send result into message event. 
            @run
        */
        async function run() {

            if (![`sandbox`, `bot`, `gacha-house`, `games`].includes(message.channel.name)) return configFormat.embedWrapper(palette.darkmatte, `You can check your inventory in bot channels.`);

            return message.channel.send(`\`fetching ${message.author.username} inventory ..\``)
                .then(async load => {
                    await get_inventobject();
                    await utils.pause(200);
                    await filtering_items(raw_object);
                    const title = `${utils.emoji(`AnnieWot`, bot)} | **Inventory card for ${message.author.username}**`;

                    !filter_alias_res ? text_interface(filter_res) : message.channel.send(title, new Attachment(await visual_interface(filter_alias_res), `inventory-${message.author.username}.jpg`))
                    load.delete();
                })
        }

        return run();
    }
}

module.exports.help = {
    start: inventory,
    name: "inventory",
    aliases: [],
    description: `Views your inventory`,
    usage: `${require(`../../.data/environment.json`).prefix}inventory`,
    group: "General",
    public: true,
    require_usermetadata: true,
    multi_user: true
}