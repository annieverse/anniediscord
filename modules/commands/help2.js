const Discord = require("discord.js");
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

    /**
     * Displays all avaible commands in each category
     */
    async helpAll() {
        const embed = new Discord.RichEmbed()
        .setColor(this.palette.darkmatte)
        .setThumbnail(this.bot.user.displayAvatarURL)
        let page = [],pages = [];
        let pageHeaderOptions = await this.groupNames();
        pageHeaderOptions.sort();

        for (let x = 0; x < pageHeaderOptions.length; x++) {
            page.push(new Array())
            let mainNames = await this.mainNames(pageHeaderOptions[x]).then(str => str.split(`\n`));
            for (let index = 0; index < mainNames.length; index++) {
                page[x].push(`**\`${mainNames[index]}\`**`);
            }
        }
        for (let i = 0;i<page.length;i++) {
            pages.push(this.utils.chunk(page[i],6))
            let header = `<:AnnieHi:501524470692053002> **Hello, I'm Annie!**\nBelow are my commands documentation for the \`${pageHeaderOptions[i].toUpperCase()}\` group.\n`;
            pages[i].forEach((element, index) => {
                if (index === 0) { element.unshift(header) } else { element.unshift(header + `**Continued**.\n`) }
            });
        }   
        this.utils.pagesDubArr(this.message, pages, embed);
        return this.utils.sendEmbed(`Need further help? Please DM <@507043081770631169>.`, this.palette.halloween)
    }

    /**
     * Displays all avaible commands for a specific category
     * @param {String} group group name
     */
    async help(group) {
        const embed = new Discord.RichEmbed()
        .setColor(this.palette.darkmatte)
        .setThumbnail(this.bot.user.displayAvatarURL)
        let pages,page = [];
        let position = 0;
        let pageHeaderOptions = await this.groupNames();
        pageHeaderOptions.sort();

        if (group.toLowerCase() === "help") return this.utils.sendEmbed(`My availble commands are:\n~help | To view all availble commands\n~help group | To look at one specific group of commands\nMy avaible groups are:\n**${pageHeaderOptions.join(", ")}**`)
        if (!pageHeaderOptions.some(x => x === group.toLowerCase())) return this.utils.sendEmbed("I'm sorry but that is not a group name, please use ~help help to find out more")

        for (let x = 0; x < pageHeaderOptions.length; x++) {
            if (group.toLowerCase() === pageHeaderOptions[x]) {
                position=x;
                page.push(new Array())
                let mainNames = await this.mainNames(pageHeaderOptions[x]).then(str => str.split(`\n`));
                for (let index = 0; index < mainNames.length; index++) {
                    page[0].push(`**\`${mainNames[index]}\`**`);
                }
            }
        }
        pages = this.utils.chunk(page[0],6)
        let header = `<:AnnieHi:501524470692053002> **Hello, I'm Annie!**\nBelow are my commands documentation for the \`${pageHeaderOptions[position].toUpperCase()}\` group.\n`;
        pages.forEach((element,index) => {if(index===0){element.unshift(header)}else{element.unshift(header + `**Continued**.\n`)}
        });
        this.utils.pages(this.message, pages, embed);
        return this.utils.sendEmbed(`Need further help? Please DM <@507043081770631169>.`, this.palette.halloween)
    }

    async specificCommandsHelp(cmdFile, group) {
        const embed = new Discord.RichEmbed()
            .setColor(this.palette.darkmatte)
            .setThumbnail(this.bot.user.displayAvatarURL)
        let pages, page = [];
        page.push(new Array(`**${group.toUpperCase()}**`))
        pages[0].push(`|command| ${cmdFile}`)
        pages[0].push(`|usage| ${await this.usage(cmdFile)}`)
        pages[0].push(`|description| ${await this.description(cmdFile)}`)
        pages = this.utils.chunk(page[0], 6)
        this.utils.pages(this.message, pages, embed);
        return this.utils.sendEmbed(`Need further help? Please DM <@507043081770631169>.`, this.palette.halloween)
    }

    async execute() {
        if (this.args.length === 0) return this.helpAll();
        if (this.args[0] === 'help') return this.help(this.args[0]);
        let pageHeaderOptions = await this.groupNames();
        for (let x = 0; x < pageHeaderOptions.length; x++) {
            if (this.args[0].toLowerCase() === pageHeaderOptions[x]) {
                let mainNames = await this.mainNames(pageHeaderOptions[x]).then(str => str.split(`\n`));
                for (let index = 0; index < mainNames.length; index++) {
                    if (this.args[0].toLowerCase()===mainNames[index]){
                        return this.specificCommandHelp(mainNames[index],pageHeaderOptions[x]);
                    }
                }
            }
        }
        if (!pageHeaderOptions.some(x => x === this.args[0].toLowerCase())) return this.utils.sendEmbed("I'm sorry but that is not a group name, please use ~help help to find out more")

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