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
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, emoji, bot:{db} }) {
        const darkThemeStrings = [`dark`, `black`, `darktheme`, `dark_profileskin`, `nightmode`, `night`]
        const lightThemeStrings = [`light`, `white`, `lighttheme`, `light_profileskin`, `lightmode`, `day`]
        await this.requestUserMetadata(2)
        //  Returns if user didn't specify any keyword
        if (!this.fullArgs) return reply(this.locale.SWITCH_THEME.MISSING_KEYWORD, {
            image: `banner_settheme`,
            socket: {prefix:this.bot.prefix} 
        })
        let currentTheme = await this.currentTheme(...arguments)
        if (darkThemeStrings.includes(this.fullArgs)) {
            if (currentTheme == `dark`) return reply(this.locale.SWITCH_THEME.ALREADY_THAT_THEME, {socket:{emoji:emoji(`AnnieYandere`)} })
            let hasTheme = await this.userHasTheme(...arguments, `dark`)
            if (!hasTheme) return reply(this.locale.SWITCH_THEME.NO_THEME_OWNED, {color: `red`})
            db.setTheme(`dark`, this.user.id, this.message.guild.id)
            return reply(this.locale.SWITCH_THEME.SET_NIGHTMODE, {status: `success`})
        }

        if (lightThemeStrings.includes(this.fullArgs)) {
            if (currentTheme == `light`) return reply(this.locale.SWITCH_THEME.ALREADY_THAT_THEME, {socket:{emoji:emoji(`AnnieYandere`)} })
            let hasTheme = await this.userHasTheme(...arguments, `light`)
            if (!hasTheme) return reply(this.locale.SWITCH_THEME.NO_THEME_OWNED, {color: `red`})
            db.setTheme(`light`, this.user.id, this.message.guild.id)
            return reply(this.locale.SWITCH_THEME.SET_LIGHTMODE, {status: `success`})
        }

        //  Handle if no theme match with the keyword
        return reply(this.locale.SWITCH_THEME.NO_MATCHING_KEYWORD, {socket: {emoji:emoji(`AnnieCry`)} })
    }

    async currentTheme({bot:{db}}){
        let res = await db.findCurrentTheme(this.user.id, this.message.guild.id)
        return res
    }

    
    /**
     * Returns a boolean for if the user has the choosen theme and gives theme to user if they dont have it
     * @param {object} [argument pass through]
     * @param {string} theme 
     * @returns {boolean} boolean
     */
    async userHasTheme({bot:{db}}, theme){
        let res = await db.checkIfThemeOwned(theme, this.user.id, this.message.guild.id)
        let resAnswer = Object.values(res)[0] == 1 ? true : false
        if (resAnswer) return true
        // Give item to user
        await db.GiveThemeToUser(theme, this.user.id, this.message.guild.id)
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