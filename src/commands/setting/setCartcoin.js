"use strict"
const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits
} = require(`discord.js`)
/**
 * Toggle artcoin conversion feature per guild setting.
 * @author klerikdust
 */
module.exports = {
  name: `setcartcoin`,
  aliases: [`setcartcoins`, `setcrc`],
  description: `Toggle the availability of artcoin conversion feature in the server`,
  usage: `setcartcoin <enable/disable>`,
  permissionLevel: 3,
  multiUser: false,
  applicationCommand: true,
  messageCommand: true,
  server_specific: false,
  default_member_permissions: PermissionFlagsBits.Administrator.toString(),
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: `enable`,
      description: `Enable the artcoin conversion feature`,
      type: ApplicationCommandOptionType.Subcommand,
    }, {
      name: `disable`,
      description: `Disable the artcoin conversion feature`,
      type: ApplicationCommandOptionType.Subcommand,
    }
  ],
  async execute(client, reply, message, arg, locale, prefix) {
    if (!arg) return reply.send(locale.SETCARTCOIN.GUIDE, {
      image: `banner_cartcoins`,
      socket: {
        prefix: message.guild.configs.get(`PREFIX`).value,
        status: message.guild.configs.get(`CARTCOIN_MODULE`).value === null
          || message.guild.configs.get(`CARTCOIN_MODULE`).value === 1
          ? locale.SETCARTCOIN.ENABLED
          : locale.SETCARTCOIN.DISABLED
      }
    })
    const toggle = arg === `enable` ? 1 : arg === `disable` ? 0 : null
    if (toggle === null) return reply.send(locale.SETCARTCOIN.INVALID_ACTION, {
      socket: {
        prefix: prefix
      }
    })
    client.db.guildUtils.updateGuildConfiguration({
      configCode: `CARTCOIN_MODULE`,
      customizedParameter: toggle,
      guild: message.guild,
      setByUserId: message.author.id,
      cacheTo: message.guild.configs
    })
    if (toggle === 1) return reply.send(locale.SETCARTCOIN.SUCCESSFULLY_ENABLED, {
      status: `success`,
      socket: {
        emoji: await client.getEmoji(`789212493096026143`)
      }
    })
    return reply.send(locale.SETCARTCOIN.SUCCESSFULLY_DISABLED, {
      status: `success`,
      socket: {
        emoji: await client.getEmoji(`789212493096026143`)
      }
    })
  },
  async Iexecute(client, reply, interaction, options, locale) {
    const toggle = options.getSubcommand() === `open` ? 1 : options.getSubcommand() === `disable` ? 0 : null
    if (toggle === null) return reply.send(locale.SETCARTCOIN.INVALID_ACTION, {
      socket: {
        prefix: interaction.guild.configs.get(`PREFIX`).value
      }
    })
    client.db.guildUtils.updateGuildConfiguration({
      configCode: `CARTCOIN_MODULE`,
      customizedParameter: toggle,
      guild: interaction.guild,
      setByUserId: interaction.member.user.id,
      cacheTo: interaction.guild.configs
    })
    if (toggle === 1) return reply.send(locale.SETCARTCOIN.SUCCESSFULLY_ENABLED, {
      status: `success`,
      socket: {
        emoji: await client.getEmoji(`789212493096026143`)
      }
    })
    return reply.send(locale.SETCARTCOIN.SUCCESSFULLY_DISABLED, {
      status: `success`,
      socket: {
        emoji: await client.getEmoji(`789212493096026143`)
      }
    })
  }
}