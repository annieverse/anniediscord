const {
    GuildMember,
    Role,
    TextChannel,
    Client,
    User,
    Message,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction,
    PrimaryEntryPointCommandInteraction,
    AnySelectMenuInteraction,
    ButtonInteraction,
    AutocompleteInteraction,
    ModalSubmitInteraction,
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`);
const { get } = require("superagent");
const { concat } = require("../eslint.config");

const getDbMock = () => ({
    databaseUtils: {
        validateUserEntry: jest.fn(() => Promise.resolve()),
        updateInventory: jest.fn(() => Promise.resolve()),
        doesCacheExist: jest.fn(() => Promise.resolve(false)),
        setCache: jest.fn(() => Promise.resolve()),
    },
    guildUtils: {
        registerGuild: jest.fn(() => Promise.resolve()),
    },
    redis: {
        sMembers: jest.fn(() => Promise.resolve([])),
    },
    userUtils: {
        getUserLocale: jest.fn(() => Promise.resolve({ lang: "en" })),
    }
});

/**
 * 
 * @returns {User}
 */
const getUserMock = () => ({
    id: "123456789012345678",
    username: "TestUser",
    bot: false,
    displayAvatarURL: jest.fn(() => "https://example.com/avatar.png"),
    tag: "TestUser#1234",
    send: jest.fn(() => Promise.resolve()),
    fetch: jest.fn(() => Promise.resolve({
        id: "123456789012345678",
        username: "TestUser",
        bot: false,
        displayAvatarURL: "https://example.com/avatar.png",
        tag: "TestUser#1234",
        send: jest.fn(() => Promise.resolve()),
    })),
    roles: {
        cache: jest.fn(() => getRoleMock()),
    },
    guild: {
        id: "123456789012345679",
        roles: {
            cache: { get: jest.fn(() => getRoleMock()) },
        },
        channels: {
            cache: { get: jest.fn(() => getTextChannelMock()) },
        },
    },
    permissions: {
        has: jest.fn(() => true),
    },
    presence: {
        status: "online",
        activities: [],
    },
    createdAt: new Date(),
    createdTimestamp: Date.now()
});

/**
 * 
 * @returns {GuildMember}
 */
const getGuildMemberMock = () => ({
    roles: {
        add: jest.fn(),
        cache: {
            get: jest.fn(),
        },
    },
    guild: {
        roles: {
            cache: {
                get: jest.fn(),
            },
        },
        channels: {
            cache: {
                get: jest.fn(),
            },
        },
    },
})

// Text Channel Mock
/**
 * 
 * @returns {TextChannel}
 */
const getTextChannelMock = () => ({
    send: jest.fn(),
    isDMBased: jest.fn(() => false),
})

// Role Mock
/**
 * 
 * @returns {Role}
 */
const getRoleMock = () =>
({
    id: "",
});

/**
 * 
 * @returns {Message}
 */
const getMessageMock = () => ({
    channel: getTextChannelMock(),
    content: "",
    author: {
        id: "123456789012345678",
        bot: false,
    },
    guild: {
        configs: {
            get: jest.fn((key) => ({
                value: ({
                    PREFIX: "!",
                    AR_MODULE: false,
                    EXP_MODULE: true,
                    CHAT_CURRENCY: `10`,
                    CHAT_EXP: `5`
                })[key]
            })),
            id: '123456789012345678',
        },
        id: '123456789012345678',
        members: {
            cache: {
                get: jest.fn(() => getGuildMemberMock()),
            },
        },
        channels: {
            cache: {
                get: jest.fn(() => getTextChannelMock()),
            },
        },
        roles: {
            cache: {
                get: jest.fn(() => getRoleMock()),
            },
        },
    },
    mentions: {
        users: {
            get: jest.fn(() => getUserMock()),
            has: jest.fn(() => false),
        }
    },
    member: {
        id: "123456789255684"
    }
})

const application_commands = new Map();
const guildonly_commands = new Map();
application_commands.set("setlanguage", {
    name: `setlanguage`,
    aliases: [`setlang`, `setlanguage`, `setlocale`],
    description: `User's language switcher`,
    usage: `setlang <language name/code>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `language`,
        description: `Available Annie's languages you can set`,
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true
    }],
    type: ApplicationCommandType.ChatInput,
    execute: jest.fn(),
    Iexecute: jest.fn(),
    run: jest.fn()
})

application_commands.set("ping", {
    name: `ping`,
    aliases: [`pong`, `p1ng`, `poing`],
    description: `Output bot's latency`,
    usage: `ping`,
    permissionLevel: 0,
    server_specific: false,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    execute: jest.fn(),
    Iexecute: jest.fn(),
    run: jest.fn()
})

const appCmdMock = {
    "userdownload": {
        name: `userdownload`,
        aliases: [`ud`, `userdl`],
        description: `Download user data`,
        usage: `userdownload`,
        permissionLevel: 0,
        server_specific: true,
        multiUser: false,
        applicationCommand: true,
        messageCommand: true,
        type: ApplicationCommandType.ChatInput,
        execute: jest.fn(),
        Iexecute: jest.fn(),
        run: jest.fn()
    }
}

guildonly_commands.set(appCmdMock)

/**
 * 
 * @returns {Client}
 */
const getClientMock = () => ({
    isReady: jest.fn(() => true),
    db: getDbMock(),
    getEmoji: jest.fn(),
    cooldowns: {
        has: jest.fn(() => false),
        set: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(() => 0),
    },
    prefix: "!",
    logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
    dev: false,
    user: {
        id: "123456789012345678",
    },
    mentions: {
        users: new Map(),
    },
    guilds: {
        cache: new Map(),
    },
    on: jest.fn(),
    once: jest.fn(),
    events: {
        ClientReady: "ready",
        Error: "error",
        Debug: "debug",
        Warn: "warn",
        InteractionCreate: "interactionCreate",
        ShardReady: "shardReady",
        MessageCreate: "messageCreate",
        GuildCreate: "guildCreate",
        GuildDelete: "guildDelete",
        ShardError: "shardError",
        MessageDelete: "messageDelete",
        MessageBulkDelete: "messageDeleteBulk",
        GuildRoleCreate: "roleCreate",
        GuildRoleDelete: "roleDelete",
        GuildEmojiCreate: "emojiCreate",
        GuildEmojiDelete: "emojiDelete",
        ChannelDelete: "channelDelete",
        ChannelCreate: "channelCreate",
        GuildBanAdd: "guildBanAdd",
        GuildBanRemove: "guildBanRemove",
        GuildMemberAdd: "guildMemberAdd",
        GuildMemberUpdate: "guildMemberUpdate"
    },
    shard: {
        ids: [0],
        count: 1,
    },
    localization: {
        lang: "en",
        findLocale: jest.fn()
    },
    experienceLibs: jest.fn(() => ({
        execute: jest.fn()
    })),
    application_commands: {
        get: jest.fn(() => application_commands),
        has: jest.fn(() => true),
        set: jest.fn(),
        concat: jest.fn()
    },
    guildonly_commands: {
        get: jest.fn(() => guildonly_commands),
        has: jest.fn(() => false),
        set: jest.fn()
    }
})

/**
 * 
 * @returns {ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction | PrimaryEntryPointCommandInteraction | AnySelectMenuInteraction | ButtonInteraction | AutocompleteInteraction | ModalSubmitInteraction}
 */
const getInteractionMock = () => ({
    type: 2,
    id: '1407541489474605136',
    applicationId: '514688969355821077',
    channelId: '689157608153546819',
    guildId: '577121315480272908',
    user: getUserMock(),
    member: getGuildMemberMock(),
    attachmentSizeLimit: 524288000,
    commandId: '1254194836043595926',
    commandName: 'ping',
    commandType: 1,
    commandGuildId: null,
    deferred: false,
    replied: false,
    ephemeral: null,
    options: {
        data: []
    }

})

module.exports = { getGuildMemberMock, getTextChannelMock, getRoleMock, getMessageMock, getClientMock, getUserMock, getInteractionMock, appCmdMock };