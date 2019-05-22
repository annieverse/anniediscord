const env = require(`../.data/environment.json`);

module.exports = (bot, message) => {

  if (message.author.bot) return;

  let prefix = env.prefix;
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);
  let command = cmd.slice(prefix.length);
  let commandfile = bot.commands.get(cmd.slice(prefix.length)) || bot.commands.get(bot.aliases.get(cmd.slice(prefix.length)));

  if (!message.content.startsWith(prefix)) return;
  if (commandfile) commandfile.run(bot, command, message, args);
}