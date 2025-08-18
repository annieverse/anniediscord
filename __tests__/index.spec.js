// Mock autoResponderController and commandController before importing messageHandler
jest.mock('../src/controllers/autoResponder', () => jest.fn());
jest.mock('../src/controllers/commands', () => jest.fn());
jest.mock('../src/utils/getNumberInRange', () => jest.fn());

// Import the controller after mocking
const autoResponderController = require('../src/controllers/autoResponder');
const commandController = require('../src/controllers/commands');
const getNumberInRange = require('../src/utils/getNumberInRange');
const { messageHandler } = require("../src/events/message/messageCreate.js");
const { interactionCreateHandler } = require("../src/events/interaction/interactionCreate.js");
const { getMessageMock, getClientMock, getInteractionMock } = require("../__mocks__/index.js");
const { Message, Client, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction, PrimaryEntryPointCommandInteraction, AnySelectMenuInteraction, ButtonInteraction, AutocompleteInteraction, ModalSubmitInteraction } = require("discord.js");

describe("Message Handler", () => {
    /**
     * @type {Message}
     */
    let message
    /**
     * @type {Client}
     */
    let client

    const sendMock = jest.fn();
    const executeMock = jest.fn();

    /**
     * Make the parameters state reset once on every test scope.
     * This way we avoid accidental global mutation by always redefining the state.
     * Stateless and stays within local-scope.
     */
    beforeEach(() => {
        jest.clearAllMocks();
        /**
         * @type {Message}
         */
        message = getMessageMock();
        /**
         * @type {Client}
         */
        client = getClientMock();
        client.responseLibs = jest.fn(() => ({
            send: sendMock
        }));
        client.experienceLibs = jest.fn(() => ({
            execute: executeMock
        }));
    });

    describe("Test(s) for early returns", () => {
        it("it shouldn't return if client is ready", async () => {
            client.isReady.mockReturnValue(true);
            await messageHandler(client, message);
            expect(client.isReady).toHaveBeenCalledTimes(1)
            expect(client.isReady).toHaveReturnedWith(true);
        });
        it("it should return if client isn't ready", async () => {
            client.isReady.mockReturnValue(false);
            await messageHandler(client, message);
            expect(client.isReady).toHaveBeenCalledTimes(1)
            expect(client.isReady).toHaveReturnedWith(false);
        });
        it("shouldn't return when a bot doesn't send a message", async () => {
            message.author.bot = false;
            await messageHandler(client, message);
            expect(message.channel.isDMBased).toHaveBeenCalledTimes(1);
        });
        it("should return when a bot sends a message", async () => {
            message.author.bot = true;
            const handler = await messageHandler(client, message);
            expect(handler).toBeUndefined();
        });
        it("should return when the message is from a DM channel", async () => {
            message.channel.isDMBased.mockReturnValue(true);
            const handler = await messageHandler(client, message);
            expect(message.channel.isDMBased).toHaveBeenCalledTimes(1);
            expect(message.channel.isDMBased).toHaveReturnedWith(true);
            expect(handler).toBeUndefined();
        });

        it("shouldn't return when the message is not from a DM channel", async () => {
            message.channel.isDMBased.mockReturnValue(false);
            const handler = await messageHandler(client, message);
            expect(message.channel.isDMBased).toHaveBeenCalledTimes(1);
            expect(message.channel.isDMBased).toHaveReturnedWith(false);
        });
        it("should return if guild configs are not defined", async () => {
            message.guild.configs = undefined;
            const handler = await messageHandler(client, message);
            expect(handler).toBeUndefined();
        });
        it("shouldn't return if guild configs are defined", async () => {
            await messageHandler(client, message);
            expect(client.db.databaseUtils.validateUserEntry).toHaveBeenCalled()
        });
        it("should return if validation fails", async () => {
            client.db.databaseUtils.validateUserEntry.mockRejectedValue(new Error("Validation failed"));
            await messageHandler(client, message);
            expect(client.logger.error).toHaveBeenCalledWith(`Failed to validate user entry for ${message.author.id} (${message.author.username})`, expect.any(Error));
        });

        it("shouldn't return if validation passes", async () => {
            await messageHandler(client, message);
            expect(client.db.guildUtils.registerGuild).toHaveBeenCalled();
        });
    });

    describe("Test(s) for displaying prefix hint", () => {
        beforeEach(() => {
            // Arrange
            message.mentions.users.has.mockReturnValue(true);
            message.content = `<@${client.user.id}>`;

            client.db.guildUtils.registerGuild.mockResolvedValue();
        });

        it("should send a prefix hint when the bot is mentioned with short content when not cached", async () => {
            client.db.databaseUtils.doesCacheExist.mockResolvedValue(false);

            // Act
            await messageHandler(client, message);
            // Assert
            expect(client.db.guildUtils.registerGuild).toHaveBeenCalledWith(message.guild)
            expect(message.mentions.users.has).toHaveBeenCalledWith(client.user.id);
            expect(client.responseLibs).toHaveBeenCalledWith(message);
            expect(sendMock).toHaveBeenCalledWith(
                "Type **`!help`** to see my commands. ♡",
                { deleteIn: 5 }
            );
        });

        it("should not send a prefix hint when the bot is mentioned with short content when cached", async () => {
            client.db.databaseUtils.doesCacheExist.mockResolvedValue(true);

            // Act
            await messageHandler(client, message);
            // Assert
            expect(client.db.guildUtils.registerGuild).toHaveBeenCalledWith(message.guild)
            expect(message.mentions.users.has).toHaveBeenCalledWith(client.user.id);
            expect(client.responseLibs).not.toHaveBeenCalledWith(message);
            expect(sendMock).not.toHaveBeenCalledWith(
                "Type **`!help`** to see my commands. ♡",
                { deleteIn: 5 }
            );
        });
    })

    describe("Test(s) for auto-responder", () => {
        it("should call autoResponderController if AR module is enabled", async () => {
            message.guild.configs.get.mockReturnValue({ value: true });
            await messageHandler(client, message);
            expect(autoResponderController).toHaveBeenCalledWith(client, message);
        });

        it("shouldn't call autoResponderController if AR module is disabled", async () => {
            message.guild.configs.get.mockReturnValue({ value: false });
            await messageHandler(client, message);
            expect(autoResponderController).not.toHaveBeenCalled();
        });
    });


    describe("Test(s) for command handling", () => {
        beforeEach(() => {
            message.guild.configs.get.mockReturnValue({ value: true });
            message.content = "!test";
        });

        it("should not call commandController if message doesn't start with prefix", async () => {
            message.content = "test";
            await messageHandler(client, message);
            expect(commandController).not.toHaveBeenCalled();
        })

        it("should call commandController if message starts with prefix [default]", async () => {
            const handler = await messageHandler(client, message);
            expect(commandController).toHaveBeenCalledWith(client, message);
            expect(handler).toBeUndefined();
        });

        it("should call commandController if message starts with prefix [client]", async () => {
            client.prefix = "#";
            message.content = "#test";
            const handler = await messageHandler(client, message);
            expect(commandController).toHaveBeenCalledWith(client, message);
            expect(handler).toBeUndefined();
        });

        it("shouldn't call commandController if message starts with prefix, but no command name provided [default]", async () => {
            message.content = "!";
            await messageHandler(client, message);
            expect(commandController).not.toHaveBeenCalled();
            expect(client.cooldowns.has).toHaveBeenCalled();
        });

        it("shouldn't call commandController if message starts with prefix, but no command name provided [client]", async () => {
            client.prefix = "#";
            message.content = "#";
            await messageHandler(client, message);
            expect(commandController).not.toHaveBeenCalled();
            expect(client.cooldowns.has).toHaveBeenCalled();
        });

    });

    describe("Test(s) for cooldowns", () => {
        it("should return if user has a cooldown active", async () => {
            const cooldownId = `POINTS_${message.author.id}@${message.guild.id}`;
            client.cooldowns.set(cooldownId, Date.now());
            await messageHandler(client, message);
            expect(client.cooldowns.set).not.toBeUndefined();
        });
        it("should continue if user has no cooldown active", async () => {
            const cooldownId = `POINTS_${message.author.id}@${message.guild.id}`;
            client.cooldowns.set(cooldownId, Date.now() - 61 * 1000); // Set cooldown to 61 seconds ago
            await messageHandler(client, message);
            expect(client.cooldowns.set).toHaveBeenCalled();
        });
        it("should calculate diff when cooldown exists", async () => {
            const cooldownId = `POINTS_${message.author.id}@${message.guild.id}`;
            // Simulate cooldown: set the last timestamp to 30 seconds ago
            const past = Date.now() - 30 * 1000;
            client.cooldowns.has = jest.fn((id) => id === cooldownId);
            client.cooldowns.get = jest.fn(() => past);

            await messageHandler(client, message);
            expect(client.cooldowns.set).not.toHaveBeenCalled();
        });
    })

    describe("Test(s) for AC module", () => {
        it("should update user inventory with AC gained", async () => {
            client.cooldowns.has.mockReturnValue(false);
            getNumberInRange.mockReturnValue(10); // Mocking the getNumberInRange function to return a fixed value

            const handler = await messageHandler(client, message);
            expect(client.db.databaseUtils.updateInventory).toHaveBeenCalledWith({
                itemId: 52,
                value: 10,
                userId: message.author.id,
                guildId: message.guild.id
            });
            expect(handler).toBeUndefined();
        });
        it("should not update user inventory if cooldown is active", async () => {
            client.prefix = "!";
            message.content = "hello world";
            client.cooldowns = new Map();

            // Simulate cooldown: set the last timestamp to now, so diff > 0
            const gainingId = `POINTS_${message.author.id}@${message.guild.id}`;
            const now = Date.now();
            client.cooldowns.set(gainingId, now);

            // Mock has/get for Map
            client.cooldowns.has = jest.fn((id) => id === gainingId);
            client.cooldowns.get = jest.fn(() => now);

            await messageHandler(client, message);
            // Assert
            expect(client.cooldowns.has).toHaveBeenCalledWith(gainingId);
            expect(client.cooldowns.get).toHaveBeenCalledWith(gainingId);
            // Should NOT update inventory since diff > 0
            expect(client.db.databaseUtils.updateInventory).not.toHaveBeenCalled();
        });

        it("should update user inventory if cooldown has expired", async () => {
            const gainingId = `POINTS_${message.author.id}@${message.guild.id}`;
            // Set the last timestamp far enough in the past so diff <= 0
            const past = Date.now() - 61 * 1000; // 61 seconds ago
            client.cooldowns.has = jest.fn((id) => id === gainingId);
            client.cooldowns.get = jest.fn(() => past);

            getNumberInRange.mockReturnValue(10);

            await messageHandler(client, message);

            expect(client.db.databaseUtils.updateInventory).toHaveBeenCalledWith({
                itemId: 52,
                value: 10,
                userId: message.author.id,
                guildId: message.guild.id
            });
        });
    })
    describe("Test(s) for EXP module", () => {
        it("should return early if EXP module is disabled", async () => {
            // Arrange: set EXP_MODULE to false
            message.guild.configs.get = jest.fn((key) => ({
                value: key === "EXP_MODULE" ? false : ({
                    PREFIX: "!",
                    AR_MODULE: false,
                    CHAT_CURRENCY: `10`,
                    CHAT_EXP: `5`
                })[key]
            }));

            await messageHandler(client, message);

            // Assert: EXP logic should not be called
            expect(client.db.userUtils.getUserLocale).not.toHaveBeenCalled();
            expect(client.experienceLibs).not.toHaveBeenCalled();
        });

        it("should add EXP if module is enabled", async () => {
            client.db.userUtils.getUserLocale.mockResolvedValue({ lang: "en" });
            getNumberInRange.mockReturnValue(10);
            const testValue = [2.5];
            client.db.redis.sMembers.mockResolvedValue(testValue);
            message.guild.members.cache.get.mockReturnValue(true);
            const accumulatedExpMultiplier = testValue.length > 0 ? 1 + testValue.reduce((p, c) => p + parseFloat(c), 0) : 1;
            const total = 10 * accumulatedExpMultiplier;
            await messageHandler(client, message);
            await new Promise(process.nextTick);
            expect(client.db.userUtils.getUserLocale).toHaveBeenCalledWith(message.author.id);
            expect(client.experienceLibs).toHaveBeenCalledWith(message.member, message.guild, message.channel, expect.any(Function));
            expect(executeMock).toHaveBeenCalledWith(total);
        });

        it("should attempt to fetch member if message.member is missing", async () => {
            // Arrange
            message.member = null
            message.guild.members.cache.has = jest.fn(() => false)
            message.guild.members.fetch = jest.fn(() => Promise.resolve())
            client.db.userUtils.getUserLocale.mockResolvedValue({ lang: "en" })
            getNumberInRange.mockReturnValue(10)
            client.db.redis.sMembers.mockResolvedValue([1])

            await messageHandler(client, message)
            // Assert
            expect(message.guild.members.cache.has).toHaveBeenCalledWith(message.author.id)
            expect(message.guild.members.fetch).toHaveBeenCalledWith(message.author.id)
        })

        it("should not fetch member if already in cache", async () => {
            message.member = null
            message.guild.members.cache.has = jest.fn(() => true) // already in cache
            message.guild.members.fetch = jest.fn() // should not be called
            client.db.userUtils.getUserLocale.mockResolvedValue({ lang: "en" })
            getNumberInRange.mockReturnValue(10)
            client.db.redis.sMembers.mockResolvedValue([1])

            await messageHandler(client, message)

            expect(message.guild.members.cache.has).toHaveBeenCalledWith(message.author.id)
            expect(message.guild.members.fetch).not.toHaveBeenCalled()
        })

        it("should log an error if fetching member throws", async () => {
            // Arrange
            message.member = null
            message.guild.members.cache.has = jest.fn(() => false)
            message.guild.members.fetch = jest.fn(() => { throw new Error("Fetch failed") })
            client.db.userUtils.getUserLocale.mockResolvedValue({ lang: "en" })
            getNumberInRange.mockReturnValue(10)
            client.db.redis.sMembers.mockResolvedValue([1])

            await messageHandler(client, message)
            // Assert
            expect(client.logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Error fetching member data for EXP calculation: Fetch failed")
            )
        })

        it("should add EXP if properties exist", async () => {
            client.db.userUtils.getUserLocale.mockResolvedValue({ lang: "en" });
            const testValue = [2.5, 1.0];
            client.db.redis.sMembers.mockResolvedValue(testValue);
            message.guild.members.cache.get.mockReturnValue(true);
            await messageHandler(client, message);
            await new Promise(process.nextTick);
            expect(client.experienceLibs).toHaveBeenCalled();
        });


        it("should not add EXP if guild is missing", async () => {
            client.db.userUtils.getUserLocale.mockResolvedValue({ lang: "en" });
            const testValue = [2.5];
            client.db.redis.sMembers.mockResolvedValue(testValue);
            message.guild.members.cache.get.mockReturnValue(true);
            message.guild.id = null;
            await messageHandler(client, message);
            await new Promise(process.nextTick);
            expect(client.experienceLibs).not.toHaveBeenCalled();
        });

        it("should call locale passthru via experienceLibs", async () => {
            client.localization.findLocale = jest.fn();
            client.db.userUtils.getUserLocale.mockResolvedValue({ lang: "en" });
            client.db.redis.sMembers.mockResolvedValue([1]);
            message.guild.members.cache.get.mockReturnValue(true);
            client.experienceLibs = jest.fn((member, guild, channel, locale) => ({
                execute: jest.fn(() => {
                    if (locale) locale("TEST_KEY");
                })
            }));

            await messageHandler(client, message);
            await new Promise(process.nextTick);

            expect(client.localization.findLocale).toHaveBeenCalledWith("TEST_KEY");
        });
    })
});

describe("Application Command Handler", () => {

    /**
     * @type {Client}
     */
    let client
    /**
     * @type {ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction | PrimaryEntryPointCommandInteraction | AnySelectMenuInteraction | ButtonInteraction | AutocompleteInteraction | ModalSubmitInteraction}
     */
    let interaction = getInteractionMock();

    interaction = getInteractionMock();
    const sendMock = jest.fn();
    const executeMock = jest.fn();

    /**
     * Make the parameters state reset once on every test scope.
     * This way we avoid accidental global mutation by always redefining the state.
     * Stateless and stays within local-scope.
     */
    beforeEach(() => {
        jest.clearAllMocks();

        /**
         * @type {ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction | PrimaryEntryPointCommandInteraction | AnySelectMenuInteraction | ButtonInteraction | AutocompleteInteraction | ModalSubmitInteraction}
         */
        interaction = getInteractionMock();

        /**
         * @type {Client}
         */
        client = getClientMock();
        client.responseLibs = jest.fn(() => ({
            send: sendMock
        }));
        client.experienceLibs = jest.fn(() => ({
            execute: executeMock
        }));
    });

    describe("Early return tests", () => {
        it("should return if client is not ready", async () => {
            client.isReady.mockReturnValue(false);
            const handler = await interactionCreateHandler(client, interaction);
            expect(client.isReady).toHaveBeenCalledTimes(1);
            expect(client.isReady).toHaveReturnedWith(false);
            expect(handler).toBeUndefined();
        });

        it("should not return if client is ready", async () => {
            client.isReady.mockReturnValue(true);
            const handler = await interactionCreateHandler(client, interaction);
            expect(client.isReady).toHaveBeenCalledTimes(1);
            expect(client.isReady).toHaveReturnedWith(true);
        });
    })

    describe("Set up params", () => {

    })

})