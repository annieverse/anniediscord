module.exports = [
    {
       /**
         *  A module that enables Logging System in the guild
         *  @type {object}
         */
        name: `LOGS_MODULE`,
        description: `A module that enables Logging System in the guild`,
        customizable: true,
        allowedTypes: [`boolean`],
        value: 0
    },
    {
        /**
         *  The target channel where logs message will be sent in
         *  @type {object}
         */
        name: `LOGS_CHANNEL`,
        description: `The target channel where logs message will be sent in`,
        customizable: true,
        allowedTypes: [`string`],
        value: null
    },
    {
        /**
         *  List of channels that allow Annie's command usage. Ignored if empty.
         *  @type {object}
         */
        name: `COMMAND_CHANNELS`,
        description: `List of channels that allow Annie's command usage. Ignored if empty`,
        customizable: true,
        allowedTypes: [`array`],
        value: []
    },
    {
        /**
          *  A module that enables Logging System in the guild for creation of channels
          *  @type {object}
          */
         name: `CHANNEL_CREATE`,
         description: `A module that enables Logging System in the guild for creation of channels`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 1
     },
     {
        /**
          *  A module that enables Logging System in the guild for deletion of channels
          *  @type {object}
          */
         name: `CHANNEL_DELETE`,
         description: `A module that enables Logging System in the guild for deletion of channels`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for updates to existing channels
          *  @type {object}
          */
         name: `CHANNEL_UPDATES`,
         description: `A module that enables Logging System in the guild for updates to existing channels`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when the channel name is changed
          *  @type {object}
          */
         name: `CHANNEL_UPDATES_NAME`,
         description: `A module that enables Logging System in the guild for when the channel name is changed`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when the channel topic is changed
          *  @type {object}
          */
         name: `CHANNEL_UPDATES_TOPIC`,
         description: `A module that enables Logging System in the guild for when the channel topic is changed`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when the channel explicient filter is changed
          *  @type {object}
          */
         name: `CHANNEL_UPDATES_NSFW`,
         description: `A module that enables Logging System in the guild for when the channel explicient filter is changed`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when the channel type is changed
          *  @type {object}
          */
         name: `CHANNEL_UPDATES_TYPE`,
         description: `A module that enables Logging System in the guild for when the channel type is changed`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when the channel postions is changed into or out of a category
          *  @type {object}
          */
         name: `CHANNEL_UPDATES_CATEGORY`,
         description: `A module that enables Logging System in the guild for when the channel postions is changed into or out of a category`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for emoji creations
          *  @type {object}
          */
         name: `EMOJI_CREATE`,
         description: `A module that enables Logging System in the guild for emoji creations`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for emoji deletions
          *  @type {object}
          */
         name: `EMOJI_DELETE`,
         description: `A module that enables Logging System in the guild for emoji deletions`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for emoji name changes
          *  @type {object}
          */
         name: `EMOJI_UPDATE`,
         description: `A module that enables Logging System in the guild for emoji name changes`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for events like prune/purge of messages
          *  @type {object}
          */
         name: `MESSAGE_DELETE_BULK`,
         description: `A module that enables Logging System in the guild for events like prune/purge of messages`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a message is deleted
          *  @type {object}
          */
         name: `MESSAGE_DELETE`,
         description: `A module that enables Logging System in the guild for when a message is deleted`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a message is edited
          *  @type {object}
          */
         name: `MESSAGE_UPDATE`,
         description: `A module that enables Logging System in the guild for when a message is edited`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for role creations
          *  @type {object}
          */
         name: `ROLE_CREATE`,
         description: `A module that enables Logging System in the guild for role creations`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for role deletions
          *  @type {object}
          */
         name: `ROLE_DELETE`,
         description: `A module that enables Logging System in the guild for role deletions`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for role name, color, or permission changes
          *  @type {object}
          */
         name: `ROLE_UPDATE`,
         description: `A module that enables Logging System in the guild for role name, color, or permission changes`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for member bans
          *  @type {object}
          */
         name: `GUILD_BAN_ADD`,
         description: `A module that enables Logging System in the guild for member bans`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for member unbans
          *  @type {object}
          */
         name: `GUILD_BAN_REMOVE`,
         description: `A module that enables Logging System in the guild for member unbans`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when bot joins a guild
          *  @type {object}
          */
         name: `GUILD_CREATE`,
         description: `A module that enables Logging System in the guild for when bot joins a guild`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when bot leaves a guild
          *  @type {object}
          */
         name: `GUILD_DELETE`,
         description: `A module that enables Logging System in the guild for when bot leaves a guild`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a member joins a guild
          *  @type {object}
          */
         name: `GUILD_MEMBER_ADD`,
         description: `A module that enables Logging System in the guild for when a member joins a guild`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a member leaves a guild
          *  @type {object}
          */
         name: `GUILD_MEMBER_REMOVE`,
         description: `A module that enables Logging System in the guild for when a member leaves a guild`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a server has an outage
          *  @type {object}
          */
         name: `GUILD_UNAVAILABLE`,
         description: `A module that enables Logging System in the guild for when a server has an outage`,
         customizable: false,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a server has a name change
          *  @type {object}
          */
         name: `GUILD_UPDATED`,
         description: `A module that enables Logging System in the guild for when a server has a name change`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
    {
        /**
         *  A module that enables Welcomer System in the guild
         *  @type {object}
         */
        name: `WELCOMER_MODULE`,
        description: `A module that enables Welcomer System in the guild`,
        customizable: true,
        allowedTypes: [`boolean`],
        value: 0
    },
    {
       /**
         *  The content of the message that going to be displayed when a user has joined guild
         *  @type {object}
         */
        name: `WELCOMER_TEXT`,
        description: `The content of the message that going to be displayed when a user has joined guild`,
        customizable: true,
        allowedTypes: [`string`],
        value: `Welcome to {{guild}}, {{user}}!`
    },
    {
        /**
         *  A target channel where welcomer/greeting message will be sent in
         *  @type {object}
         */
        name: `WELCOMER_CHANNEL`,
        description: `A target channel where welcomer/greeting message will be sent in`,
        customizable: true,
        allowedTypes: [`string`],
        value: null
    },
    {

        /**
         *  A given set of roles when user has joined the guild
         *  @type {object}
         */
        name: `WELCOMER_ROLES`,
        description: `A given set of roles when user has joined the guild`,
        customizable: true,
        allowedTypes: [`array`],
        value: []
    },
    {
        /**
         *  The image that will be displayed as welcomer's background.
         *  @type {object}
         */
        name: `WELCOMER_IMAGE`,
        description: `The image that will be displayed as welcomer's background`,
        customizable: true,
        allowedTypes: [`string`],
        value: `welcomer` 
    },
    {
        /**
         *  Define light or dark overlay for the welcomer. 
         *  @type {object}
         */
        name: `WELCOMER_THEME`,
        description: `Define light or dark overlay for the welcomer`,
        customizable: true,
        allowedTypes: [`string`],
        value: `light` 
    },
    {
        /**
         *  A given role when someone bought nickname changer item from the shop
         *  @type {object}
         */
        name: `NICKNAME_CHANGER_ROLE`,
        description: `A given role when someone bought nickname changer item from the shop`,
        customizable: true,
        allowedTypes: [`string`],
        value: null
    },
    {
        /**
         *  A module that enables Heart/Likes System for every user's posted art
         *  @type {object}
         */
        name: `POST_MODULE`,
        description: `A module that enables Heart/Likes System for every user's posted art`,
        customizable: true,
        allowedTypes: [`boolean`],
        value: 0
    },
    {
        /**
         *  A list of channels that Annie will be watching for a new post
         *  @type {object}
         */
        name: `POST_COLLECTOR_CHANNELS`,
        description: `A list of channels that Annie will be watching for a new post`,
        customizable: true,
        allowedTypes: [`array`],
        value: []
    },
    {
        /**
         *  A given role when someone has boosted the server
         *  @type {object}
         */
        name: `NITRO_ROLE`,
        description: `A given role when someone has boosted the server`,
        customizable: true,
        allowedTypes: [`string`],
        value: null
    },
    {
        /**
         *  A module that announce a message when someone has boosted the server
         *  @type {object}
         */
        name: `NITRO_NOTIFICATIONS`,
        description: `A module that announce a message when someone has boosted the server`,
        customizable: true,
        allowedTypes: [`boolean`],
        value: 1
    },
    {
        /**
         *  A module that enables Annie's Experience Point System
         *  @type {object}
         */
        name: `EXP_MODULE`,
        description: `A module that actives Annie's Experience Point System`,
        customizable: true,
        allowedTypes: [`boolean`],
        value: 1
    },
    {
        /**
         *  A module that sends level-up message when member is leveling up.
         *  @type {object}
         */
        name: `LEVEL_UP_MESSAGE`,
        description: `A module that sends level-up message when member is leveling up.`,
        customizable: true,
        allowedTypes: [`boolean`],
        value: 1
    },
    {
        /**
         *  The displayed message content when someones leveled up.
         *  @type {object}
         */
        name: `LEVEL_UP_TEXT`,
        description: `The displayed message content when someones leveled up.`,
        customizable: true,
        allowedTypes: [`string`],
        value: ``
    },
    {
        /**
         *  Requirement amount of likes before post gets to trending channel
         *  @type {object}
         */
        name: `FEATURED_REQUIREMENT`,
        description: `Requirement amount of likes before post gets to trending channel`,
        customizable: true,
        allowedTypes: [`number`],
        value: 10
    },
    {
        /**
         *  A module that send user's post to trending channel once reached specific amount of likes
         *  @type {object}
         */
        name: `FEATURED_MODULE`,
        description: `A module that send user's post to trending channel once reached specific amount of likes`,
        customizable: true,
        allowedTypes: [`boolean`],
        value: 0
    },
    {
        /**
         *  A list of available ranks that user able to get on every level up
         *  @type {object}
         */
        name: `RANKS_LIST`,
        description: `A list of available ranks that user able to get on every level up`,
        customizable: true,
        allowedTypes: [`array`],
        value: []
    },
    {
        /**
         *  A module that enables a customized role-rank system in the guild.
         *  @type {object}
         */
        name: `CUSTOM_RANK_MODULE`,
        description: `A module that enables a customized role-rank system in the guild.`,
        customizable: true,
        allowedTypes: [`number`],
        value: 0
    },
    {
        /**
         *  Allows rank roles to be stacked or not.
         *  @type {object}
         */
        name: `RANKS_STACK`,
        description: `Allows rank roles to be stacked or not`,
        customizable: true,
        allowedTypes: [`boolean`],
        value: 0
    },
    {
        /**
         *  A list of role id for the server booster
         *  @type {object}
         */
        name: `BOOSTER_COLORS_LIST`,
        description: `A list of role id for the server booster`,
        customizable: true,
        allowedTypes: [`array`],
        value: []
    },
    {
        /**
         *  A role to be assigned to mute user
         *  @type {object}
         */
        name: `MUTE_ROLE`,
        description: `A role to be assigned to mute user`,
        customizable: true,
        allowedTypes: [`string`],
        value: null
    },
    {
        /**
         *  A role to be assigned for the event participant
         *  @type {object}
         */
        name: `EVENT_PARTICIPANT_ROLE`,
        description: `A role to be assigned for the event participant`,
        customizable: true,
        allowedTypes: [`string`],
        value: null
    },
    {
        /**
         *  Amount of artcoins to be given to Annie's Donator
         *  @type {object}
         */
        name: `DONATOR_ARTCOINS_PACKAGE`,
        description: `Amount of artcoins to be given to Annie's Donator`,
        customizable: false,
        allowedTypes: [`number`],
        value: 100000
    },
    {
        /**
         *  A list of messages for the booster colors
         *  @type {object}
         */
        name: `BOOSTER_COLORS_MESSAGES`,
        description: `A list of messages for the booster colors`,
        customizable: true,
        allowedTypes: [`array`],
        value: []
    },
    {
        /**
         *  A list of colors to be used as booster's perks
         *  @type {object}
         */
        name: `BOOSTER_COLORS`,
        description: `A list of colors to be used as booster's perks`,
        customizable: true,
        allowedTypes: [`array`],
        value: []
    },
    {
        /**
         *  A module to enable dynamic-color changing for a guild's booster role.
         *  @type {object}
         */
        name: `NITRO_ROLE_COLOR_CHANGER`,
        description: `A module to enable dynamic-color changing for a guild.`,
        customizable: true,
        allowedTypes: [`number`],
        value: 0
    },
    {
        /**
         *  This is the command prefix that Annie will be using.
         *  If not defined, it will use `>` as the default prefix.
         *  @type {object}
         */
        name: `PREFIX`,
        description: `A prefix that being used to call Annie's Command.`,
        customizable: true,
        allowedTypes: [`string`],
        value: process.env.PREFIX || `>`
    },
    {
        /**
         *  Allowing guild invite to be generated.
         *  @type {object}
         */
        name: `MESSAGE_GUILD_INVITE`,
        description: `Allowing guild invite to be generated.`,
        customizable: true,
        allowedTypes: [`number`],
        value: 0
    },
    {
        /**
          *  A module that enables Logging System in the guild for creation of channels
          *  @type {object}
          */
         name: `CHANNEL_CREATE`,
         description: `A module that enables Logging System in the guild for creation of channels`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 1
     },
     {
        /**
          *  A module that enables Logging System in the guild for deletion of channels
          *  @type {object}
          */
         name: `CHANNEL_DELETE`,
         description: `A module that enables Logging System in the guild for deletion of channels`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for updates to existing channels
          *  @type {object}
          */
         name: `CHANNEL_UPDATES`,
         description: `A module that enables Logging System in the guild for updates to existing channels`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when the channel name is changed
          *  @type {object}
          */
         name: `CHANNEL_UPDATES_NAME`,
         description: `A module that enables Logging System in the guild for when the channel name is changed`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when the channel topic is changed
          *  @type {object}
          */
         name: `CHANNEL_UPDATES_TOPIC`,
         description: `A module that enables Logging System in the guild for when the channel topic is changed`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when the channel explicient filter is changed
          *  @type {object}
          */
         name: `CHANNEL_UPDATES_NSFW`,
         description: `A module that enables Logging System in the guild for when the channel explicient filter is changed`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when the channel type is changed
          *  @type {object}
          */
         name: `CHANNEL_UPDATES_TYPE`,
         description: `A module that enables Logging System in the guild for when the channel type is changed`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when the channel postions is changed into or out of a category
          *  @type {object}
          */
         name: `CHANNEL_UPDATES_CATEGORY`,
         description: `A module that enables Logging System in the guild for when the channel postions is changed into or out of a category`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for emoji creations
          *  @type {object}
          */
         name: `EMOJI_CREATE`,
         description: `A module that enables Logging System in the guild for emoji creations`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for emoji deletions
          *  @type {object}
          */
         name: `EMOJI_DELETE`,
         description: `A module that enables Logging System in the guild for emoji deletions`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for emoji name changes
          *  @type {object}
          */
         name: `EMOJI_UPDATE`,
         description: `A module that enables Logging System in the guild for emoji name changes`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for events like prune/purge of messages
          *  @type {object}
          */
         name: `MESSAGE_DELETE_BULK`,
         description: `A module that enables Logging System in the guild for events like prune/purge of messages`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a message is deleted
          *  @type {object}
          */
         name: `MESSAGE_DELETE`,
         description: `A module that enables Logging System in the guild for when a message is deleted`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a message is edited
          *  @type {object}
          */
         name: `MESSAGE_UPDATE`,
         description: `A module that enables Logging System in the guild for when a message is edited`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for role creations
          *  @type {object}
          */
         name: `ROLE_CREATE`,
         description: `A module that enables Logging System in the guild for role creations`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for role deletions
          *  @type {object}
          */
         name: `ROLE_DELETE`,
         description: `A module that enables Logging System in the guild for role deletions`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for role name, color, or permission changes
          *  @type {object}
          */
         name: `ROLE_UPDATE`,
         description: `A module that enables Logging System in the guild for role name, color, or permission changes`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for member bans
          *  @type {object}
          */
         name: `GUILD_BAN_ADD`,
         description: `A module that enables Logging System in the guild for member bans`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for member unbans
          *  @type {object}
          */
         name: `GUILD_BAN_REMOVE`,
         description: `A module that enables Logging System in the guild for member unbans`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when bot joins a guild
          *  @type {object}
          */
         name: `GUILD_CREATE`,
         description: `A module that enables Logging System in the guild for when bot joins a guild`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when bot leaves a guild
          *  @type {object}
          */
         name: `GUILD_DELETE`,
         description: `A module that enables Logging System in the guild for when bot leaves a guild`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a member joins a guild
          *  @type {object}
          */
         name: `GUILD_MEMBER_ADD`,
         description: `A module that enables Logging System in the guild for when a member joins a guild`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a member leaves a guild
          *  @type {object}
          */
         name: `GUILD_MEMBER_REMOVE`,
         description: `A module that enables Logging System in the guild for when a member leaves a guild`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a server has an outage
          *  @type {object}
          */
         name: `GUILD_UNAVAILABLE`,
         description: `A module that enables Logging System in the guild for when a server has an outage`,
         customizable: false,
         allowedTypes: [`boolean`],
         value: 0
     },
     {
        /**
          *  A module that enables Logging System in the guild for when a server has a name change
          *  @type {object}
          */
         name: `GUILD_UPDATED`,
         description: `A module that enables Logging System in the guild for when a server has a name change`,
         customizable: true,
         allowedTypes: [`boolean`],
         value: 0
     },
    {
        /**
         *  The target channel where level-up message will be sent in
         *  @type {object}
         */
        name: `LEVEL_UP_MESSAGE_CHANNEL`,
        description: `The target channel where level-up message will be sent in`,
        customizable: true,
        allowedTypes: [`string`],
        value: ``
    },
    {
        /**
         *  Toggle Annie's Autoresponder Module
         *  @type {object}
         */
        name: `AR_MODULE`,
        description: `Toggle Annie's Autoresponder Module`,
        customizable: true,
        allowedTypes: [`boolean`],
        value: 0
    }
]
