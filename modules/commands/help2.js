const Discord = require("discord.js");
const formatManager = require('../../utils/formatManager.js');
const fs = require('fs');
class help {
    constructor(Stacks) {
        this.utils = Stacks.utils;
        this.message = Stacks.message;
        this.bot = Stacks.bot;
        this.args = Stacks.args;
        this.palette = Stacks.palette;
        this.stacks = Stacks;
    }
    /**
     * locates all groups names
     * @returns {Array} group names
     */
    async groupNames() {
        let file_arr = [];
        fs.readdir("./modules/commands/", (err, files) => {
            if (err) console.log(err);
            const src = require(`./${files[0]}`);
            file_arr.push(src.help.group.toLowerCase());
            for (let file in files) {
                const src = require(`./${files[file]}`);
                if (!file_arr.includes(src.help.group.toLowerCase())) {
                    file_arr.push(src.help.group.toLowerCase());
                }
            }
        })
        await this.utils.pause(200)
        return file_arr
    };
    /**
     * grabs the main name for all commands
     * @returns {string} command names joined by \n
     */
    async mainNames(groupname) {

        let file_arr = [];
        fs.readdir("./modules/commands/", (err, files) => {
            if (err) console.log(err);

            for (let file in files) {
                const src = require(`./${files[file]}`);
                if (src.help.group.toLowerCase() === groupname) {
                    if (src.help.public) { file_arr.push(src.help.name.toLowerCase());}
                }
            }
        })
        await this.utils.pause(200)
        file_arr = file_arr.join("\n");
        return file_arr
    };
    /**
     * Grabs any aliases for a file if one exists
     * @param {String} file file name
     * @returns {Array} Array of aliases names 
     */
    async aliases(file) {
        let file_arr = [];
        const src = require(`./${file}`);
        if (src.help.aliases.length === 0) return file_arr = " ";
        for (let x = 0; x < src.help.aliases.length; x++) {
            file_arr.push(src.help.aliases[x].toLowerCase());
        }
        await this.utils.pause(200)
        return file_arr;
    };

    /**
     * Grabs any usage for a file if one exists
     * @param {String} file file name
     * @returns {String} string of usage 
     */
    async usage(file) {
        let file_rst;
        const src = require(`./${file}`);
        file_rst = src.help.usage.toLowerCase();
        await this.utils.pause(200)
        return file_rst;
    };
    /**
     * Grabs any description for a file if one exists
     * @param {String} file file name
     * @returns {String} string of description 
     */
    async description(file) {
        let file_rst;
        const src = require(`./${file}`);
        file_rst = src.help.description.toLowerCase();
        await this.utils.pause(200)
        return file_rst;
    };
    async helpAll() {
        const embed = new Discord.RichEmbed()
        .setColor(this.palette.darkmatte)
        .setThumbnail(this.bot.user.displayAvatarURL)
        let pages = [];
        let pageHeaderOptions = await this.groupNames();
        pageHeaderOptions.sort();

        for (let x = 0; x < pageHeaderOptions.length; x++) {
            pages.push(new Array(`**${pageHeaderOptions[x].toUpperCase()}**`))
            pages[x].push(`- ${await this.mainNames(pageHeaderOptions[x]).then(str => str.replace(/\n/g, `\n- `))}`)
        }
        return this.utils.pages(this.message, pages, embed);
    }

    async help(group) {
        const embed = new Discord.RichEmbed()
        .setColor(this.palette.darkmatte)
        .setThumbnail(this.bot.user.displayAvatarURL)
        let pages = [];
        let pageHeaderOptions = await this.groupNames();
        pageHeaderOptions.sort();

        if (group.toLowerCase() === "help") return this.utils.sendEmbed(`My availble commands are:\n~help | To view all availble commands\n~help group | To look at one specific group of commands\nMy avaible groups are:\n**${pageHeaderOptions.join(", ")}**`)
        if (!pageHeaderOptions.some(x => x === group.toLowerCase())) return this.utils.sendEmbed("I'm sorry but that is not a group name, please use ~help help to find out more")

        for (let x = 0; x < pageHeaderOptions.length; x++) {
            if (group.toLowerCase() === pageHeaderOptions[x]) {
                pages.push(new Array(`**${pageHeaderOptions[x].toUpperCase()}**`))
                let mainNames = await this.mainNames(pageHeaderOptions[x]).then(str => str.split(`\n`));
                for (let index = 0; index < mainNames.length; index++) {
                    let aliases = await this.aliases(mainNames[index])
                    pages[0].push(new Array(`*${mainNames[index]}*`));
                    pages[0].push(`|usage| ${await this.usage(mainNames[index])}`)
                    pages[0].push(`|description| ${await this.description(mainNames[index])}`)
                    if (typeof (aliases) === 'object') {
                        pages[0].push(`|alias|-> ${aliases}`);
                    }
                }
            }
        }
        return this.utils.pages(this.message, pages, embed);
    }

    async execute() {
        if (this.args.length === 0) return this.helpAll();
        this.help(this.args[0])
    }
}

module.exports.help = {
    start: help,
    name: "help2",
    aliases: ["thelp"],
    description: `all avaible commands`,
    usage: `~help`,
    group: "general",
    public: false,
    require_usermetadata: true,
    multi_user: false
}