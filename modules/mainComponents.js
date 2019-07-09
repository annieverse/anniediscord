`use-strict`;

const Data = require(`../utils/userdataSelector`);


  /**
  * Command Handler
  * @param {Object} base_components should have atleast Client/bot and Message Instance object
  */
class CommandHandler {
  constructor(base_components = {}) {
    this.stacks = base_components
    this.filename = this.stacks.commandfile.help.name;
    this.path = `../modules/commands/${this.filename}.js`;
    this.module_parameters = require(this.path).help;
    this.cmd = this.module_parameters.start;
  }

  //  Pull user metadata from database.
  async requestData() {
    if (!this.module_parameters.required_usermetadata) return;
    this.stacks.meta = await new Data(this.stacks).pull();
  }


  //  Initialize.
  async init() {
    try {
      this.requestData()
        .then(() => {
          return new this.cmd(require(`../utils/Pistachio`)(this.stacks)).execute();
        })
    }
    catch (e) {
      console.log(e)
    }
  }
}


module.exports = CommandHandler