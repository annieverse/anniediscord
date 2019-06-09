`use-strict`;

const Data = require(`../utils/userdataSelector`);


  /**
  * Preferred components would be {bot, message, command, args, utils, palette};
  * 
  * @bot to handle discord library.
  * @message for current message instance.
  * @command as the command codename.
  * @args as the commands parameters.
  * @utils as general utilities to support the functions.
  * @palette as hexcolor container.
  */
class CommandHandler {
  constructor(custom_components = {}) {
    this.components = custom_components;
    this.filename = this.components.commandfile.help.name;
    this.path = `../modules/commands/${this.filename}.js`;
    this.module_parameters = require(this.path).help;
    this.cmd = this.module_parameters.start;
  }


  //  Pull user metadata from database.
  async requestData() {
    if(!this.module_parameters.required_usermetadata)return;
    this.components.meta = await new Data(this.components).pull();
  }


  //  Initialize.
  async init() {
    try {
      this.requestData()
        .then(() => {
          return new this.cmd(this.components).execute();
        })
    }
    catch (e) {
      console.log(e)
    }
  }
}


module.exports = CommandHandler