const { Canvas } = require("canvas-constructor"); 
const { resolve, join } = require("path");
const Discord = require("discord.js");
const palette = require("../colorset.json");
const formatManager = require('../utils/formatManager');

const sql = require('sqlite');
sql.open('.data/database.sqlite');

Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-bold.ttf")), "RobotoBold");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-thin.ttf")), "RobotoThin");
Canvas.registerFont(resolve(join(__dirname, "../fonts/Whitney.otf")), "Whitney");

module.exports.run = async (bot, command, message, args, utils) => {


const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;



    let user_collection = {};
    function user_cardcollection() {
        return sql.get(`SELECT * FROM collections WHERE userId = ${message.author.id}`)
            .then(async data => {
                user_collection = data
            })
    }




    let filtered_res;
    async function filter_items(container) {
        let bag = container, parsedbag = {};


        delete container.userId;


       //  Check whether the container is empty or filled.
        const empty_bag = () => {
            for(let i in container) {
                if(container[i] !== null || container[i] > 0)return false;
            }
            return true;
        }



        //  Remove property that contain null values from an object
        const eliminate_nulls = () => {
            for(let i in bag) {
                if(bag[i] === null || bag[i] < 1) { delete bag[i] }
            }
        }


        // Label itemname & rarity for each item from itemlist
        const labeling = () => {

            for(let i in bag) {
                sql.get(`SELECT name FROM itemlist WHERE alias = "${i}"`)
                    .then(async data => {
                    sql.get(`SELECT rarity FROM luckyticket_rewards_pool WHERE item_name = "${data.name}"`)
                        .then(async secdata => parsedbag[data.name] = secdata.rarity)
                })
            }
        }

        if(empty_bag())return filtered_res = null;


        eliminate_nulls();
        labeling();
        await utils.pause(500);
        filtered_res = parsedbag;
    }


    let msg_res = [];
    function text_interface() {

        const body = () => {
            const embed = new Discord.RichEmbed()
            .setColor(palette.darkmatte);

            const formatting = () => {   
                let i = 1, content = ``;
                for(let key in filtered_res) {
                    content += `[${i}] ${`☆`.repeat(filtered_res[key])} - [${key}](https://discord.gg/Tjsck8F)\n`
                    i++
                }
                return content;
            }

            !filtered_res ? embed.setDescription(`You don't have any collection.`) : embed.setDescription(formatting());
            return msg_res.push(embed);
        }

        body();   
    }


    /**
        Send result into message event. 
        @run
    */
    async function run() {
            return message.channel.send(`\`fetching ${message.author.username} card collection ..\``)
                .then(async load => {
                    await user_cardcollection();
                    await filter_items(user_collection);
                    await text_interface();

                    message.channel.send(`**${message.author.username}'s Collection**`)
                        .then(async title => {
                            message.channel.send(msg_res[0])
                            load.delete();
                        })
                })      
    }

    return run();

}

exports.help = {
  name: "collection",
        aliases:[]
}