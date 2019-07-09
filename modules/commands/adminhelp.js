const Discord = require('discord.js');
const fs = require('fs');

class adminHelp {
  constructor(Stacks) {
    this.stacks = Stacks;
    this.required_roles = Stacks.message.member.roles.find(r => Object.keys(this.stacks.roles.admin).some(i => this.stacks.roles.admin[i] !== r.id));
    this.bicon = Stacks.bot.user.displayAvatarURL;
    this.admEmbed = new Discord.RichEmbed();
    this.admEmbed2 = new Discord.RichEmbed();
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
     * Displays all avaible commands for a specific category
     * @param {String} group group name
     */
  async help() {
    let group = 'admin';

    let pages, page = [];
    let position = 0;
    let pageHeaderOptions = await this.groupNames();
    pageHeaderOptions.sort();

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
    pages = this.stacks.utils.chunk(page[0], 10)
    let header = `<:AnnieHi:501524470692053002> **Hello, I'm Annie!**\nBelow are my commands documentation for the \`${pageHeaderOptions[position].toUpperCase()}\` group.\n`;
    pages.forEach((element, index) => {
      if (index === 0) { element.unshift(header + `[${index + 1}/${pages.length}]`) } else { element.unshift(header + `[${index + 1}/${pages.length}]\n **Continued**.\n`) }
    });
    return pages
  }

  noAthorization() {
    this.admEmbed.setColor(this.stacks.palette.red);
    this.admEmbed.setDescription(`You don't have authorization to use this command.`);
    this.admEmbed.setFooter(`Anime Artist United | Admin Help Section`, this.bicon);
    this.stacks.message.channel.send(this.admEmbed);
  }

  sendDMComfirmation() {
    this.admEmbed2.setDescription(`I've sent you the DM!`);
    this.admEmbed2.setColor(this.stacks.palette.halloween);
    this.admEmbed2.setFooter("Anime Artist United | Admin Help Section", this.bicon);
    this.stacks.message.channel.send(this.admEmbed2);
  }

  failedDM_ERROR() {
    this.admEmbed.setColor('#5178a5')
    this.admEmbed.setDescription(`I tried to DM you ${this.stacks.message.author.username}, but your DMs are locked. T__T`)
    this.admEmbed.setFooter(`Anime Artist United | Admin Help Section`, this.bicon)
    return this.stacks.message.channel.send(this.admEmbed)
  }

  initializeEmbed() {
    this.admEmbed.setColor(this.stacks.palette.darkmatte)
    this.admEmbed.setThumbnail(this.stacks.bot.user.displayAvatarURL)
  }

  async execute() {
    if (this.required_roles) return this.noAthorization();
    this.stacks.message.react("👌")
    try {
      let pages = await this.help();
      pages.forEach((element, index) => { this.admEmbed.setDescription(element); if (index === pages.length - 1) { this.stacks.message.author.send(this.admEmbed) } else { this.stacks.message.author.send(this.admEmbed).then(() => this.sendDMComfirmation()); } });
    } catch (e) {
      console.log(`[ERROR LOG for adminhelp.js\n\n${await e}\n`)
      this.failedDM_ERROR();
    }
  }
}

module.exports.help = {
  start: adminHelp,
  name: "adminhelp",
  aliases: ["ahelp"],
  description: `A list of all admin commands sent by dm`,
  usage: `${require(`../../.data/environment.json`).prefix}adminhelp`,
  group: "Admin",
  public: true,
  required_usermetadata: false,
  multi_user: false
}