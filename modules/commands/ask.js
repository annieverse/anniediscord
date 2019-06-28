  /**
   * Main module
   * @Ask 8ball-like question.
   */
  class Ask {
    constructor(Stacks) {
      this.stacks = Stacks;
    }

    async execute() {
      const { args, reply, code: {ASK}, choice } = this.stacks;
      
      //  Returns if no question was specified.
      if (!args[0]) return reply(ASK.SHORT_GUIDE)

      const question = args.slice(0).join(" ");
      const chance = 100 - Math.floor(Math.random() * 100);

      //  If chances are below 30, echo question.
      if(chance <= 30) await reply(question + `?`)

      //  Finishing answer.
      return reply(choice(ASK.ANSWERS))
    }
  }


  module.exports.help = {
    start: Ask,
    name: "ask",
    aliases: [],
    description: `You can ask any question and Annie will answer you.`,
    usage: `${require(`../../.data/environment.json`).prefix}ask <message>`,
    group: "Fun",
    public: true,
    required_usermetadata: false,
    multi_user: false
  }