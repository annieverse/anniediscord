const Command = require(`../../libs/commands`)
/**
 * Theme switcher for donator
 * @author klerikdust
 */
class SwitchTheme extends Command {

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
	async execute({ reply, bot:{db} }) {
        const darkThemeStrings = [`dark`, `black`, `darktheme`, `dark_profileskin`, `nightmode`, `night`]
        const lightThemeStrings = [`light`, `white`, `lighttheme`, `light_profileskin`, `lightmode`, `day`]
        await this.requestUserMetadata(2)
        
        //  Returns if user not categorized as server booster/donator
        //if (!this.user.premium) return reply(this.locale.SWITCH_THEME.UNAVAILABLE, {color: `red`})
        //  Returns if user didn't specify any keyword
        if (!this.fullArgs) return reply(this.locale.SWITCH_THEME.MISSING_KEYWORD, {color: `red`})

        let currentTheme = await this.currentTheme(...arguments)
        if (currentTheme == `none`) return reply(this.locale.SWITCH_THEME.NO_THEMES_OWNED)
        
        if (darkThemeStrings.includes(this.fullArgs)) {
            if (currentTheme == `dark`) return reply(this.locale.SWITCH_THEME.ALREADY_THAT_THEME)
            let hasTheme = await this.userHasTheme(...arguments, `dark`)
            if (!hasTheme) return reply(this.locale.SWITCH_THEME.NO_THEME_OWNED)
            db.setTheme(`dark`, this.user.id, this.message.guild.id)
            return reply(this.locale.SWITCH_THEME.SET_NIGHTMODE, {color: `lightgreen`})
        }

        if (lightThemeStrings.includes(this.fullArgs)) {
            if (currentTheme == `light`) return reply(this.locale.SWITCH_THEME.ALREADY_THAT_THEME)
            let hasTheme = await this.userHasTheme(...arguments, `light`)
            console.log(hasTheme)
            if (!hasTheme) return reply(this.locale.SWITCH_THEME.NO_THEME_OWNED)
            db.setTheme(`light`, this.user.id, this.message.guild.id)
            return reply(this.locale.SWITCH_THEME.SET_LIGHTMODE, {color: `lightgreen`})
        }

        //  Handle if no theme match with the keyword
        return reply(this.locale.SWITCH_THEME.NO_MATCHING_KEYWORD)
    }

    async currentTheme({bot:{db}}){
        let res = await db.findCurrentTheme(this.user.id, this.message.guild.id)
        return res
    }

    
    /**
     * Returns a boolean for if the user has the choosen theme
     * @param {object} [argument pass through]
     * @param {string} theme 
     * @returns {boolean} boolean
     */
    async userHasTheme({bot:{db}}, theme){
        let res = await db.checkIfThemeOwned(theme, this.user.id, this.message.guild.id)
        console.log(res)
        return Object.values(res)[0] == 1 ? true : false
    }
}


module.exports.help = {
	start: SwitchTheme,
	name: `switchingTheme`,
	aliases: [`theme`, `themeswitch`, `switchtheme`],
	description: `Theme switcher for donator`,
	usage: `theme <Night/Day>`,
    group: `User`,
    permissionLevel: 0,
	multiUser: false
}