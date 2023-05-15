/**
 * User's language switcher.
 * @author klerikdust
 */
module.exports = {
  name: `setLanguage`,
  aliases: [`setlang`, `setlanguage`, `setlocale`],
  description: `User's language switcher`,
  usage: `setlang <language name/code>`,
  permissionLevel: 0,
  multiUser: false,
  applicationCommand: true,
  messageCommand: true,
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
  }
}