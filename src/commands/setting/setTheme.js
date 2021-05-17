const Command = require(`../../libs/commands`)
/**
 * Switch your profile theme to Light or Dark.
 * @author klerikdust
 */
class setTheme extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
	}

    /**
     * Running command workflow
     * @return {void}
     */
	async execute() {
        const darkThemeStrings = [`dark`, `black`, `darktheme`, `dark_profileskin`, `nightmode`, `night`]
        const lightThemeStrings = [`light`, `white`, `lighttheme`, `light_profileskin`, `lightmode`, `day`]
        await this.requestUserMetadata(2)
        //  Returns if user didn't specify any keyword
        if (!this.fullArgs) return this.reply(this.locale.SWITCH_THEME.MISSING_KEYWORD, {
            image: `banner_settheme`,
            socket: {prefix:this.bot.prefix} 
        })
        let currentTheme = await this.currentTheme(...arguments)
        if (darkThemeStrings.includes(this.fullArgs)) {
            if (currentTheme == `dark`) return this.reply(this.locale.SWITCH_THEME.ALREADY_THAT_THEME, {socket:{emoji: await this.bot.getEmoji(`790338393015713812`)} })
            let hasTheme = await this.userHasTheme(`dark`)
            if (!hasTheme) return this.reply(this.locale.SWITCH_THEME.NO_THEME_OWNED)
            this.bot.db.setTheme(`dark`, this.user.master.id, this.message.guild.id)
            return this.reply(this.locale.SWITCH_THEME.SET_NIGHTMODE, {status: `success`})
        }

        if (lightThemeStrings.includes(this.fullArgs)) {
            if (currentTheme == `light`) return this.reply(this.locale.SWITCH_THEME.ALREADY_THAT_THEME, {socket:{emoji: await this.bot.getEmoji(`790338393015713812`)} })
            let hasTheme = await this.userHasTheme(`light`)
            if (!hasTheme) return this.reply(this.locale.SWITCH_THEME.NO_THEME_OWNED)
            this.bot.db.setTheme(`light`, this.user.master.id, this.message.guild.id)
            return this.reply(this.locale.SWITCH_THEME.SET_LIGHTMODE, {status: `success`})
        }

        //  Handle if no theme match with the keyword
        return this.reply(this.locale.SWITCH_THEME.NO_MATCHING_KEYWORD, {socket: {emoji: await this.bot.getEmoji(`692428578683617331`)} })
    }

    async currentTheme() {
        let res = await this.bot.db.findCurrentTheme(this.user.master.id, this.message.guild.id)
        return res
    }
    
    /**
     * Returns a boolean for if the user has the choosen theme and gives theme to user if they dont have it
     * @param {string} theme 
     * @returns {boolean} boolean
     */
    async userHasTheme(theme){
        let res = await this.bot.db.checkIfThemeOwned(theme, this.user.master.id, this.message.guild.id)
        let resAnswer = Object.values(res)[0] == 1 ? true : false
        if (resAnswer) return true
        // Give item to user
        await this.bot.db.GiveThemeToUser(theme, this.user.master.id, this.message.guild.id)
        return true
    }
}


module.exports.help = {
	start: setTheme,
	name: `setTheme`,
	aliases: [`theme`, `themeswitch`, `switchtheme`, `settheme`],
	description: `Switch your profile theme to Light or Dark.`,
	usage: `theme <Light/Dark>`,
    group: `Setting`,
    permissionLevel: 0,
	multiUser: false
}
