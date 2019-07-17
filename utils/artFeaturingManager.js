const { dev, administrator_id } = require(`../.data/environment`);
const { art_domain } = require(`../modules/config`);
const database = require(`../utils/databaseManager`);
const KeyvClient = require(`keyv`);
const keyv = new KeyvClient();


// Handle DB connection errors
keyv.on('error', err => console.log('Connection Error', err));


/**
 *  Handles #Featured system
 *  @ClassWrapper
 */
class HeartCollector {
    constructor(Stacks) {
        this.components = { 
            user: Stacks.user, 
            reaction: Stacks.reaction, 
            bot:Stacks.bot, 
            message:Stacks.reaction.message, 
            meta: {author:null}
        };
        this.stacks = require(`./Pistachio`)(this.components);
        this.metadata = {
            featured_channel: Stacks.bot.channels.get("582808377864749056"),
            featured_requirement: 10,
            main_emoji: `❤`,
            msg: Stacks.reaction.message,
            get artwork() {
                return this.msg.attachments.first().url;
            },
            get caption() {
                //  Return blank caption
                if (!this.msg.content) return ``
                //  Chop caption with length exceed 180 characters.
                if (this.msg.content.length >= 180) return this.msg.content.substring(0, 180) + `. .`

                return this.msg.content;
            },
            get favs() {
                Stacks.reaction.fetchUsers();

                function test() {
                    if (Stacks.reaction.users.size > Stacks.reaction.count) {
                        return Stacks.reaction.users.size;
                    } else if (Stacks.reaction.users.size < Stacks.reaction.count) {
                        return Stacks.reaction.count;
                    } else if (Stacks.reaction.users.size == Stacks.reaction.count) {
                        return Stacks.reaction.count;
                    }
                }
                return test();
            },
            get heartsTooLow() {
                return this.favs < this.featured_requirement;
            },
            get notAuthorizedSandboxUser() {
                return dev && !administrator_id.includes(Stacks.user.id)
            },
            get unmatchEmoji() {
                return Stacks.reaction.emoji.name !== this.main_emoji
            },
            get nonArtChannels() {
                return !art_domain.includes(this.msg.channel.id)
            },
            get selfLiking() {
                return this.msg.author.id === Stacks.user.id
            }

        }
        this.reactid = `${this.metadata.artwork}:${this.components.user.id}`,
        this.notificationTimeout = 3600000
    }


    /**
     *  Pull user metadata (temporary)
     */
    get userdata() {
        return new database(this.metadata.msg.author.id).userMetadata
    }


    /**
     *  Send post notification to user's DM.
     */
    async notification() {
        //  Mutation pistachio
        const { reply, code:{FEATURED}, bot, user } = this.stacks
        const { get_notification } = await this.userdata

        //  Returns if user react is a this.bot
        if (bot.user.id === user.id) return;

        //  Returns if user has disabled their notification
        if (!get_notification) return;

        try {
            //  If heart count is below or equal two.
            if (this.metadata.favs <= 2) {
                return reply(FEATURED.FIRST_LIKE, {
                    socket: [user.username],
                    thumbnail: this.metadata.artwork,
                    field: this.metadata.msg.author,
                    notch: true
                })
            }
            //  If user heart counts are sufficient to be featured
            if (this.metadata.favs === this.metadata.featured_requirement) {
                return reply(FEATURED.SUCCESSFUL, {
                    socket: [this.metadata.msg.author.username, this.metadata.msg.channel],
                    thumbnail: this.metadata.artwork,
                    field: this.metadata.msg.author,
                    notch: true
                })
            }
            //  Regular notification
            return reply(FEATURED.LIKED, {
                socket: [user.username, this.metadata.favs - 1],
                thumbnail: this.metadata.artwork,
                field: this.metadata.msg.author,
                notch: true
            })
        }
        catch(e) {}
    }


    /**
     *  Register new heart and check for feature
     */
    async Add() {
        //  Mutation pistachio
        const { reply, avatar, db, reaction, user } = this.stacks

        //  Returns if user is not authorized in development server
        if (this.metadata.notAuthorizedSandboxUser) return

        //  Returns if current channel is not listed in arts channels.
        if (this.metadata.nonArtChannels) return

        //  Returns if the reaction is unmatch.
        if (this.metadata.unmatchEmoji) return

        //  Returns if user trying to heart their own post
        if (this.metadata.selfLiking) return reaction.remove(user)

        //  Returns if user has recently liked the post
        if (await keyv.get(this.reactid)) return

        //  Store recent reaction to avoid double notification spam. Restored in 1 hour.
        keyv.set(this.reactid, `1`, this.notificationTimeout)

        //  Send notification to user based on heart counts
        this.notification();

        //  Store new heart
        await db(this.metadata.msg.author.id).addHeart();

        //  Send post to #featured if heart counts hitting the requirement
        if (this.metadata.favs === this.metadata.featured_requirement) {
            reply(this.metadata.caption + `\n\u200b`, {
                prebuffer: true,
                image: this.metadata.artwork,
                field: this.metadata.featured_channel,
                customHeader: [this.metadata.msg.author.tag, avatar(this.metadata.msg.author.id)]
            }) 
        }
    }


    /**
     *  Substract heart and re-fetch message
     */
    async Remove() {
        const { bot, reaction } = this.stacks

        reaction.fetchUsers();
        if (reaction.message.partial) await reaction.message.fetch();
        const rmsg = reaction.message;

        if (reaction.emoji.name == this.metadata.main_emoji && art_domain.includes(rmsg.channel.id)) { // change rmsg.channel.id == "530223957534703636" for the art channels
            reaction.fetchUsers()
            let x = rmsg.reactions.filter(reaction => reaction.emoji.name == "❤").first();
            if (rmsg.author.id == bot.user.id) return;//make sure its not this.bots id
            if (x == undefined) x = 0; // if it has no likes set value to 0
            if (x.count < 3 || x == 0) { // minimum likes or no like to delete

                //  Normalizing the string.
                const remove_symbols = (str) => {
                    let new_str = str.replace(/[^a-zA-Z0-9]/g, "");
                    return new_str;
                }

                //Fwubbles Version (Remove single compressed message / ID in the footer)
                let msg_collection = await this.metadata.featured_channel.fetchMessages()// i dunno how this method works
                let msg_array2 = msg_collection.array();

                let delete_this_id;
                for (let i = 0; i < msg_array2.length; i++) {
                    //  Skip if embed is not available
                    if (!msg_array2[i].embeds[0].description) continue;
                    //  Skip if the given ID is not match
                    if (remove_symbols(msg_array2[i].embeds[0].description) !== rmsg.id) continue;
                    //  Assign ID 
                    delete_this_id = msg_array2[i].id;
                }

                try {
                    //  Skip if no deleteable ID found
                    if (!delete_this_id) return;

                    this.metadata.featured_channel.fetchMessage(delete_this_id)
                    .then(message => message.delete())
                }
                catch(e) {
                    throw e;
                }
            }
        }
    }
}

module.exports = HeartCollector