"use strict"
const {
  ApplicationCommandType,
  ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * User's language switcher.
 * @author klerikdust
 */
module.exports = {
  name: `setlanguage`,
  aliases: [`setlang`, `setlanguage`, `setlocale`],
  description: `User's language switcher`,
  usage: `setlang <language name/code>`,
  permissionLevel: 0,
  multiUser: false,
  applicationCommand: true,
  messageCommand: true,
  options: [{
    name: `language`,
    description: `Available Annie's languages you can set`,
    type: ApplicationCommandOptionType.String,
  }],
  type: ApplicationCommandType.ChatInput,
  async execute(client, reply, message, arg, locale, prefix) {
      if (!arg) return await reply.send(locale.SETLANGUAGE.GUIDE, {
          image: `banner_setlanguage`,
          socket: {
              prefix: message.guild.configs.get(`PREFIX`).value,
              languages: `<${client.localizer.localeCodesPool.join(`/`)}>`,
              currentLanguage: locale.__metadata.targetLang
          }
      })
      const availableLocales = client.localizer.localeCodesPool
      const targetLocale = arg.toLowerCase()
      if (!availableLocales.includes(targetLocale)) {
        return reply.send(locale.SETLANGUAGE.INVALID_LANG, {
          socket: {
              languages: `<${client.localizer.localeCodesPool.join(`/`)}>`
          }
        })
      }
      locale = client.localizer.getTargetLocales(targetLocale)
      await client.db.userUtils.updateUserLocale(targetLocale, message.author.id)
      return reply.send(locale.SETLANGUAGE.SUCCESSFUL, {
          status: `success`,
          socket: {
              language: targetLocale.toUpperCase()
          }
      })
  },
  async Iexecute(client, reply, interaction, options, locale) {
    const arg = options.getString(`language`)
    if (!arg) return await reply.send(locale.SETLANGUAGE.GUIDE, {
      image: `banner_setlanguage`,
      socket: {
          prefix: interaction.guild.configs.get(`PREFIX`).value,
          languages: `<${client.localizer.localeCodesPool.join(`/`)}>`,
          currentLanguage: locale.__metadata.targetLang
      }
    })
    const availableLocales = client.localizer.localeCodesPool
    const targetLocale = arg.toLowerCase()
    if (!availableLocales.includes(targetLocale)) {
      return reply.send(locale.SETLANGUAGE.INVALID_LANG, {
        socket: {
            languages: `<${client.localizer.localeCodesPool.join(`/`)}>`
        }
      })
    }
    locale = client.localizer.getTargetLocales(targetLocale)
    await client.db.userUtils.updateUserLocale(targetLocale, interaction.member.id)
    return reply.send(locale.SETLANGUAGE.SUCCESSFUL, {
      status: `success`,
      socket: {
          language: targetLocale.toUpperCase()
      }
    })
  }
}