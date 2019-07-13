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
        this.embed = new Discord.RichEmbed();
        this.dm = false
    }

    // This will format all embeds used in this file
    initializeEmbed() {
        this.embed.setColor(this.palette.darkmatte)
    }

    async allowedToUse() {
        if (this.message.member.roles.find(r => Object.keys(this.role.admin).some(i => this.role.admin[i] == r.id))) return true;
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
                    if (src.help.public) { file_arr.push(src.help.name.toLowerCase()); }
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
        src = require(`./${file}`);
        file_rst = src.help.group.toLowerCase();
        await this.stacks.pause(200)
        return file_rst;
    };

    /**
     * Grabs any file name baised on an alias or file inputed
     * @param {String} cmd file name
     * @returns {String} string of file
     */
    async returnFileName(cmd) {
        let file_name = cmd;
        fs.readdir("./modules/commands/", (err, files) => {
            if (err) console.log(err);
            for (let file in files) {
                const src = require(`./${files[file]}`);
                if (src.help.name.toLowerCase() === cmd.toLowerCase || src.help.aliases.includes(cmd.toLowerCase())) {
                    file_name = src.help.name;
                    continue;
                }
            }
        });
        await this.stacks.pause(200)
        return file_name;
    }

    deleteObjectFromArr(arr, obj) {
        var index = arr.indexOf(obj);
        if (index > -1) {
            arr.splice(index, 1);
        }
    }

    /**
     * Displays all avaible commands in each category
     */
    async helpAll(dmState) {
        this.message.channel.send(this.stacks.code.HELP.FETCHING).then(async load => {
            let page = [], pages = [];
            let pageHeaderOptions = await this.groupNames();
            pageHeaderOptions.sort();

            if (await this.allowedToUse() === false) deleteObjectFromArr(pageHeaderOptions)

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
                    page[x].push(`**\`${mainNames[index]}\`** : ${await this.description(mainNames[index])}`);
                }
            }

            if (dmState) {
                for (let i = 0; i < page.length; i++) {
                    pages.push(this.utils.chunk(page[i], 10))
                    let header = `\n**Below are my commands documentation for the \`${pageHeaderOptions[i].toUpperCase()}\` group.**\n`;
                    pages[i].forEach((element, index) => {
                        if (index === 0) { element.unshift(header) }
                    });
                }
                let newPageEdit = []

                pages.forEach((element) => {
                    element.forEach((obj) => {
                        newPageEdit.push(obj.join('\n'))
                    })
                })
                let splitPages = this.utils.chunk(newPageEdit, 2)
                this.stacks.reply(this.needHelp, { field: this.stacks.message.author })
                splitPages.forEach(element => {
                    this.stacks.reply(element, { field: this.stacks.message.author })
                })

            } else {
                for (let i = 0; i < page.length; i++) {
                    pages.push(this.utils.chunk(page[i], 6))
                    let header = `<:AnnieHi:501524470692053002> **Hello, I'm Annie!**\nBelow are my commands documentation for the \`${pageHeaderOptions[i].toUpperCase()}\` group.\n`;
                    pages[i].forEach((element, index) => {
                        if (index === 0) { element.unshift(header) } else { element.unshift(header + `**Continued**.\n`) }
                    });
                }
                this.utils.pages(this.message, pages, this.embed);
                this.utils.sendEmbed(this.needHelp, this.palette.darkmatte)
            }
            return load.delete();
        })

    }

    /**
     * Displays all avaible commands for a specific category
     * @param {String} group group name
     */
    async help(group, dmState) {
        console.log("in help group")
        let pageHeaderOptions = await this.groupNames();
        pageHeaderOptions.sort();

        if (group.toLowerCase() === "help") {
            return this.utils.sendEmbed(`My available commands are:\n\nhelp: \`\`\`fix\nTo view all availble commands\`\`\`help group: \`\`\`fix\nTo look at one specific group of commands\`\`\`My available groups are: \`\`\`fix\n${pageHeaderOptions.join(", ")}\`\`\`help command:\`\`\`fix\nTo look at a specific command\`\`\``)
        }

        if (group === 'admin') {
            if (await this.allowedToUse() === false) return this.utils.sendEmbed(this.stacks.code.ROLE.ERR.WRONG.ROLE)
        }

        this.message.channel.send(this.stacks.code.HELP.FETCHING).then(async load => {
            let pages, page = [];
            let position = 0;
            for (let x = 0; x < pageHeaderOptions.length; x++) {
                if (group.toLowerCase() === pageHeaderOptions[x]) {
                    position = x;
                    page.push(new Array())
                    let mainNames = await this.mainNames(pageHeaderOptions[x]).then(str => str.split(`\n`));
                    for (let index = 0; index < mainNames.length; index++) {
                        page[0].push(`**\`${mainNames[index]}\`** : ${await this.description(mainNames[index])}`);
                    }
                }
            }
            let header = `<:AnnieHi:501524470692053002> **Hello, I'm Annie!**\nBelow are my commands documentation for the \`${pageHeaderOptions[position].toUpperCase()}\` group.\n`;
            pages = this.utils.chunk(page[0], 10)

            if (dmState) {
                let newPage = []
                console.log(pages.length)
                pages[0].unshift(header)
                pages.forEach((element) => {
                    newPage.push(element.join("\n"));
                });
                this.stacks.reply(this.needHelp, { field: this.stacks.message.author })
                newPage.forEach(element => {
                    this.stacks.reply(element, { field: this.stacks.message.author })
                })
            } else {
                pages.forEach((element, index) => {
                    if (index === 0) { element.unshift(header) } else { element.unshift(header + `**Continued**.\n`) }
                });
                this.utils.pages(this.message, pages, this.embed);
                this.utils.sendEmbed(this.needHelp, this.palette.darkmatte)
            }
            return load.delete();
        })
    }

    async specificCommandsHelp(cmdFile, group, dmState) {
        if (group === 'admin') {
            if (await this.allowedToUse() === false) return this.utils.sendEmbed(this.stacks.code.ROLE.ERR.WRONG.ROLE);
        }
        this.message.channel.send(this.stacks.code.HELP.FETCHING).then(async load => {
            let pages, page = [];
            this.embed.setFooter(`<required>|[optional]`)
            page.push(new Array(`\`\`\`fix\n${await this.usage(cmdFile)}\`\`\``))
            page[0].push(`Information\n\`\`\`ymal\n${await this.description(cmdFile)}\`\`\``)
            pages = this.utils.chunk(page[0], 6)
            if (dmState) {
                this.stacks.reply(pages[0], { field: this.stacks.message.author, footer: `<required>|[optional]` })
            } else {
                this.utils.pages(this.message, pages, this.embed);
            }
            return load.delete();
        })
    }

    async startUp(dmState) {
        let page, pages = [];
        let pageHeaderOptions = await this.groupNames();
        pageHeaderOptions.sort();
        let General = await this.mainNames('general').then(str => str.split(`\n`));
        let Fun = await this.mainNames('fun').then(str => str.split(`\n`));
        let Shop_Related = await this.mainNames('shop-related').then(str => str.split(`\n`));
        let server = await this.mainNames('server').then(str => str.split(`\n`));
        let prefix = require(`../../.data/environment.json`).prefix;
        let header = `<:AnnieHi:501524470692053002> **Hello, I'm Annie!**\nHere are some commands to get you started and information on how to use my advanced help menu:\n`;
        let advanceHelpMenuHelp = `**My available commands are:**\nhelp: \`\`\`fix\nTo view all availble commands\`\`\`help group: \`\`\`fix\nTo look at one specific group of commands\`\`\`My available groups are: \`\`\`fix\n${pageHeaderOptions.join(", ")}\`\`\`help command:\`\`\`fix\nTo look at a specific command\`\`\``
        let advanceHelpMenu = `To find out more about my advanced help menu options please Hit the next emoji or type ${prefix}help help\`\n`;
        let other_info = `If you would like the messages for advanced help to go to your dms please type \`--dm\` with the command (ie. ${prefix}help general --dm)\n\n`
        let starterCommands = `
            ⇨ **General** [7/${General.length}]
            \`balance\`, \`profile\`, \`daily\`, \`inventory\`, \`collection\`, \`rep\`, \`gift\`

            ⇨ **Fun** [2/${Fun.length}]
            \`ask\`, \`avatar\`

            ⇨ **Shop-related** [5/${Shop_Related.length}]
            \`eat\` (capsules), \`buy\`, \`pay\`, \`redeem\`, \`shop\`, \`roll\` - For Gacha, \`multi-roll\` - For Gacha,

            ⇨ **Server** [4/${server.length}]
            \`stats\`, \`ping\`, \`invite\`, \`join\` 
            `;

        page = header + starterCommands + `\n` + other_info + advanceHelpMenu
        pages.push(page)
        pages.push(advanceHelpMenuHelp)
        if (dmState) {
            this.stacks.reply(this.needHelp, { field: this.stacks.message.author })
            this.stacks.reply(pages, { field: this.stacks.message.author })
            //this.utils.pages(this.message, pages, this.embed);
        } else {
            this.utils.pages(this.message, pages, this.embed);
        }
    }

    async helpCenter() {

        let obj = '--dm'
        if (this.args.some(value => value.toLowerCase() === '--dm')) {
            this.deleteObjectFromArr(this.args, obj)
            this.dm = true;
            this.helpCenter();
        } else {
            if (this.args.length === 0) return this.startUp(this.dm);

            if (this.args[0] === 'all') return this.helpAll(this.dm); // Sends the basic overall help of all available commands and groups, when no args are detected
            
            let file = await this.returnFileName(this.args[0].toLowerCase()); // grabs the file name of a command
            let pageHeaderOptions = await this.groupNames(); // Intializes the groups for all commands
            if (this.args[0].toLowerCase() === 'help') return this.help(this.args[0].toLowerCase(), this.dm); // Sends a help message for the help command, ie. ${prefix}help help
            
            for (let x = 0; x < pageHeaderOptions.length; x++) { // Loops through all available groups
                let mainNames = await this.mainNames(pageHeaderOptions[x]).then(str => str.split(`\n`)); // Gets all available commands and assigns them to their groups
                if (pageHeaderOptions.some(x => x.toLowerCase() === this.args[0].toLowerCase())) return this.help(this.args[0].toLowerCase(), this.dm); // if a group name is detected, only the commands for that group will be sent

                // Set the Group name if their is a groups name availiable 
                let group_name;
                try {
                    group_name = await this.group(file.toLowerCase());
                } catch (err) {
                    group_name = undefined;
                }
                if (group_name === undefined) return this.utils.sendEmbed(this.stacks.code.ROLE.ERR.WRONG.FILE)
                if (group_name.toLowerCase() === pageHeaderOptions[x] && group_name !== undefined) { // Tests to see if the arg being passed through is a command in a group
                    for (let index = 0; index < mainNames.length; index++) { // Loops through all available options for the command
                        if (file.toLowerCase() === mainNames[index]) { // Tests for the correct file
                            return this.specificCommandsHelp(mainNames[index], pageHeaderOptions[x], this.dm); // returns a help message for that specific command
                        }
                    }
                }
            }
        }
    }

    async execute() {
        this.initializeEmbed();
        if (this.args.length === 0) return this.startUp();
        this.helpCenter();


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