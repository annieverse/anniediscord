`use-strict`;

const Data = require(`../utils/userdataSelector`);


  /**
  * Command Handler
  * @param {Object} base_components should have atleast Client/bot and Message Instance object
  */
class CommandHandler {
  constructor(base_components = {}) {
    this.stacks = require(`../utils/Pistachio`)(base_components)
    this.filename = this.stacks.commandfile.help.name;
    this.path = `../modules/commands/${this.filename}.js`;
    this.module_parameters = require(this.path).help;
    this.cmd = this.module_parameters.start;
  }

  //  Pull user metadata from database.
  async requestData() {
    if (!this.module_parameters.require_usermetadata) return;
    this.components.meta = await new Data(this.stacks).pull();
  }


  //  Initialize.
  async init() {
    try {
      this.requestData()
        .then(() => {
          return new this.cmd(this.stacks).execute();
        })
    }
    catch (e) {
      console.log(e)
    }
  }
}


module.exports = CommandHandler