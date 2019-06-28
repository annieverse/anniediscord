const { RichEmbed, Attachment } = require(`discord.js`);
const databaseManager = require(`./databaseManager`);
/**
 *  Micro framework to support Annie's structure
 *  Lightweight, portable and opinionated
 *  @Pistachio
 *  
 *  This was originally made by Pan to aggregate all the essential
 *  functions as a single package of utils.
 *  But since then, it got bigger and putting much advantage into our 
 *  day to day workflow,
 *  It might be a good idea to give it a unique name
 *  so here our smol @Pistachio !
 *  
 */
module.exports = (Components) => {
    //  Get main components to make pistachio works
    let { bot, message } = Components;

    // Initialize default container
    let container = { ...Components };

    //  Storing message codes
    container.code = require(`./predefinedMessages`);

    //  Storing colorset
    container.palette = require(`./colorset`);

    //  Storing role ids
    container.roles = require(`./role-list.json`);

    //  Storing functions.js functions
    container.utils = require(`./functions.js`)(bot, message);

    //  Storing transaction checkout handler
    container.Checkout = require(`./TransactionCheckout`);
    
    //  Storing main transaction handler
    container.Transaction = require(`./TransactionHandler`);

    //  Check for administrator authority
    container.isAdmin = message.member.roles.find(r => r.name === 'Creators Council');

    //  Automatically convert weird number notation into real value.
    container.trueInt = (str) => {
        return (!Number.isNaN(Number(str)) && !(Math.round(Number(str)) <= 0) && Number.isFinite(Number(str))) 
        ? Math.round(Number(str)) : NaN;
    }

    //  Returns username based on the id.
    container.name = (id) => {
        return bot.users.get(id).username;
    }

    //  Returns avatar URL based on the id.
    container.avatar = (id) => {
        return bot.users.get(id).displayAvatarURL;
    }

    //  Wrapping out avatar message.
    container.avatarWrapper = (id) => {
        message.react('📸')
        const reactions = [
			"Amazing!",
			"I wuv it ❤",
			"Awesome art!",
			"Magnificent~",
			"#2k19 #topselfie",
			"Beautiful!!",
			"Avatar of the day!"
		];
		const randomReactions = reactions[Math.floor(Math.random() * reactions.length)];
        const [Avatar, Name] = [container.avatar(id), container.name(id)]
        const embed = new RichEmbed()
            .setImage(Avatar)
            .setAuthor(Name, Avatar)
            .setColor(container.palette.darkmatte)
            
    
        return message.channel.send(embed)
            .then(() => {
                message.channel.send(randomReactions)
            })
    }


    //  An emoji finder. Returns as unicode
    container.emoji = (name) => {
        try {
            return bot.emojis.find(e => e.name === name)
        } catch (e) {
            throw new TypeError(`${name} is not a valid emoji.`)
        }
    }

    //  Format numbers with more than 3 digits
    container.commanifier = (number = 0) => {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    //  Initializing database class
    container.db = (id) => new databaseManager(id);

    //  Outputing bot's ping
    container.ping = container.commanifier(Math.round(bot.ping));

    //  Returns random index of elemenet from given array
    container.choice = (arr = []) => {
        return arr[Math.floor(Math.random() * arr.length)]
    }

    /**
     * Lifesaver promise. Used pretty often when calling an API.
     * @pause
     */
    container.pause = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }, // End of pause

    /** Annie's custom system message.
     *  @param content as the message content
     *  @param {object} 
     *  @param socket is the optional message modifier. Array
     *  @param color for the embed color. Hex code
     *  @param field as the message field target (GuildChannel/DM). Object
     *  @param image as the attachment url. Buffer
     *  @param simplified as non embed message toggle. Boolean
     *  @param thumbnail as embed icon. StringuRL
     *  @param notch as huge blank space on top and bottom
     *  @param thumbnail as message icon on top right
     *  @param deleteIn as countdown before the message get deleted. In seconds.
     */
    container.reply = (content, options = {
        socket: [],
        color: ``,
        image: null,
        field: message.channel,
        simplified: false,
        notch: false,
        thumbnail: null,
        deleteIn: 0,
    }) => {
        options.socket = !options.socket ? [] : options.socket;
        options.color = !options.color ? container.palette.darkmatte : options.color;
        options.image = !options.image ? null : options.image;
        options.field = !options.field ? message.channel : options.field;
        options.simplified = !options.simplified ? false : options.simplified;
        options.thumbnail = !options.thumbnail ? null : options.thumbnail;
        options.notch = !options.notch ? false : options.notch;

        //  Socketing
        for (let i = 0; i < options.socket.length; i++) {
            if (content.indexOf(`{${i}}`) != -1) content = content.replace(`{${i}}`, options.socket[i]);
        }

        //  Returns simple message w/o embed
        if (options.simplified) return options.field.send(content);

        //  Add notch/chin
        if (options.notch) content = `\u200C\n${content}\n\u200C`;


        const embed = new RichEmbed()
            .setColor(options.color)
            .setDescription(content)
            .setThumbnail(options.thumbnail)


        //  Add image preview
        if (options.image) {
            embed.attachFile(new Attachment(options.image, `preview.jpg`))
            embed.setImage(`attachment://preview.jpg`)
        } else if (embed.file) {
            embed.image.url = null;
            embed.file = null
        }


        //  Convert deleteIn parameter into milliseconds.
        options.deleteIn = options.deleteIn * 1000;

        //  If deleteIn parameter was not specified
        if (!options.deleteIn) return options.field.send(embed);

        return options.field.send(embed)
            .then(msg => {
                msg.delete(options.deleteIn)
            })
    }

    return container;
}