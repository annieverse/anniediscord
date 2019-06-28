const Discord = require("discord.js");
const fs = require('fs');

class help {
    constructor(Stacks) {
        this.utils = Stacks.utils;
        this.message = Stacks.message;
        this.bot = Stacks.bot;
        this.args = Stacks.args;
        this.palette = Stacks.palette;
        this.log = Stacks.log;
        this.role = Stacks.roles;
        this.stacks = Stacks;
        this.needHelp = `Need further help? Please DM <@507043081770631169>.`;
        this.embed = new Discord.RichEmbed()
    }

    // This will format all embeds used in this file
    initializeEmbed(){
        this.embed.setColor(this.palette.darkmatte)
        this.embed.setThumbnail(this.bot.user.displayAvatarURL);
    }

    async allowedToUse() {
        if (this.message.member.roles.find(r => Object.keys(this.role.admin).some(i=>this.role.admin[i]==r.id))) return true;
        return false;
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
        await this.stacks.pause(200)
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
        await this.stacks.pause(200)
        file_arr = file_arr.join("\n");
        return file_arr
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
        await this.stacks.pause(200)
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
        await this.stacks.pause(200)
        return file_rst;
    };

    /**
     * Grabs any group for a file if one exists
     * @param {String} file file name
     * @returns {String} string of group 
     */
    async group(file) {
        let file_rst;
        let src;
        try {
            src = require(`./${file}`);            
        } catch (error) {
            this.utils.sendEmbed(this.log.ROLE.ERR.WRONG.FILE); return false
        }
        file_rst = src.help.group.toLowerCase();
        await this.stacks.pause(200)
        return file_rst;
    };

    /**
     * Displays all avaible commands in each category
     */
    async helpAll() {
        let page = [],pages = [];
        let pageHeaderOptions = await this.groupNames();
        pageHeaderOptions.sort();

        if (await this.allowedToUse()===false) deleteObjectFromArr(pageHeaderOptions)

        function deleteObjectFromArr(arr) {
            var index = arr.indexOf('admin');
            if (index > -1) {
                arr.splice(index, 1);
            }
        }

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
        this.utils.pages(this.message, pages, this.embed);
        return this.utils.sendEmbed(this.needHelp, this.palette.halloween)
    }

    /**
     * Displays all avaible commands for a specific category
     * @param {String} group group name
     */
    async help(group) {
        if (group === 'admin') {
            if (await this.allowedToUse() === false) return this.utils.sendEmbed(this.stacks.code.ROLE.ERR.WRONG.ROLE)
        }
        
        let pages,page = [];
        let position = 0;
        let pageHeaderOptions = await this.groupNames();
        pageHeaderOptions.sort();

        if (group.toLowerCase() === "help") {
            return this.utils.sendEmbed(`My available commands are:\n\nhelp: \`\`\`fix\nTo view all availble commands\`\`\`help group: \`\`\`fix\nTo look at one specific group of commands\`\`\`My available groups are: \`\`\`fix\n${pageHeaderOptions.join(", ")}\`\`\`help command:\`\`\`fix\nTo look at a specific command\`\`\``)
        }
        
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
        this.utils.pages(this.message, pages, this.embed);
        return this.utils.sendEmbed(this.needHelp, this.palette.halloween)
    }

    async specificCommandsHelp(cmdFile, group) {
        if(group==='admin'){
            if (await this.allowedToUse() === false) return this.utils.sendEmbed(this.stacks.code.ROLE.ERR.WRONG.ROLE)
        }
        
        let pages, page = [];
        page.push(new Array(`**${group.toUpperCase()}** - Group`))
        page[0].push(`\nCommand\n\`\`\`fix\n${cmdFile}\`\`\``)
        page[0].push(`How to use\n\`\`\`fix\n${await this.usage(cmdFile)}\`\`\``)
        page[0].push(`What is this command\n\`\`\`fix\n${await this.description(cmdFile)}\`\`\``)
        pages = this.utils.chunk(page[0], 6)
        this.utils.pages(this.message, pages, this.embed);
        return this.utils.sendEmbed(this.needHelp, this.palette.halloween)
    }

    async execute() {
        this.initializeEmbed();
        if (this.args.length === 0) return this.helpAll(); // Sends the basic overall help of all available commands and groups, when no args are detected
        if (this.args[0] === 'help') return this.help(this.args[0]); // Sends a help message for the help command, ie. ${prefix}help help
        let pageHeaderOptions = await this.groupNames(); // Intializes the groups for all commands
        for (let x = 0; x < pageHeaderOptions.length; x++) { // Loops through all available groups
            let mainNames = await this.mainNames(pageHeaderOptions[x]).then(str => str.split(`\n`)); // Gets all available commands and assigns them to their groups
            if (pageHeaderOptions.some(x => x === this.args[0].toLowerCase()))return this.help(this.args[0]); // if a group name is detected, only the commands for that group will be sent
            if (await this.group(this.args[0].toLowerCase()).then(res=>res===false))return; // Tests for the arg being passed through, if its a valid command
            if (await this.group(this.args[0].toLowerCase()) === pageHeaderOptions[x]) { // Tests to see if the arg being passed through is a command in a group
                for (let index = 0; index < mainNames.length; index++) { // Loops through all available options for the command
                    if (this.args[0].toLowerCase()===mainNames[index]){ // Tests for the correct file
                        return this.specificCommandsHelp(mainNames[index],pageHeaderOptions[x]); // returns a help message for that specific command
                    }
                }
            }
        }
    }
}

module.exports.help = {
    start: help,
    name: "help2",
    aliases: ["thelp"],
    description: `all avaible commands`,
    usage: `${require(`../../.data/environment.json`).prefix}help`,
    group: "general",
    public: false,
    require_usermetadata: true,
    multi_user: false
}