// Mock autoResponderController and commandController before importing messageHandler
jest.mock('../src/controllers/autoResponder', () => jest.fn());
jest.mock('../src/controllers/commands', () => jest.fn());
jest.mock('../src/utils/getNumberInRange', () => jest.fn());

// Import the controller after mocking
const autoResponderController = require('../src/controllers/autoResponder');
const commandController = require('../src/controllers/commands');
const getNumberInRange = require('../src/utils/getNumberInRange');
const { messageHandler } = require("../src/events/message/messageCreate.js");
const { getMessageMock, getClientMock } = require("../__mocks__/index.js");
const { Message } = require("discord.js");

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
        client = getClientMock();
        client.responseLibs = jest.fn(() => ({
            send: sendMock
        }));
        client.experienceLibs = jest.fn(() => ({
            execute: executeMock
        }));
    });

    it("it should return if client isn't ready", async () => {
        client.isReady.mockReturnValue(false);
        const handler = await messageHandler(client, message);
        expect(client.isReady).toHaveBeenCalledTimes(1)
        expect(client.isReady).toHaveReturnedWith(false);
        expect(handler).toBeUndefined();
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

    it("should return if guild configs are not defined", async () => {
        message.guild.configs = undefined;
        const handler = await messageHandler(client, message);
        expect(handler).toBeUndefined();
    });

    it("should return if validation fails", async () => {
        client.db.databaseUtils.validateUserEntry.mockRejectedValue(new Error("Validation failed"));
        await messageHandler(client, message);
        expect(client.logger.error).toHaveBeenCalledWith(`Failed to validate user entry for ${message.author.id} (${message.author.username})`, expect.any(Error));
    });

    it("should send a prefix hint when the bot is mentioned with short content when not cached", async () => {
        // Arrange
        message.mentions.users.has.mockReturnValue(true);
        message.content = `<@${client.user.id}>`;

        client.db.guildUtils.registerGuild.mockResolvedValue();
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
        // Arrange
        message.mentions.users.has.mockReturnValue(true);
        message.content = `<@${client.user.id}>`;

        client.db.guildUtils.registerGuild.mockResolvedValue();
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
    it("should call autoResponderController if AR module is enabled", async () => {

        message.guild.configs.get.mockReturnValue({ value: true });

        await messageHandler(client, message);

        expect(autoResponderController).toHaveBeenCalledWith(client, message);
        expect(commandController).not.toHaveBeenCalled();
    });

    it("should call commandController if message starts with prefix", async () => {

        message.guild.configs.get.mockReturnValue({ value: true });
        message.content = "!test";

        const handler = await messageHandler(client, message);

        expect(commandController).toHaveBeenCalledWith(client, message);
        expect(handler).toBeUndefined();
    });

    it("should return if user has a cooldown active", async () => {
        const cooldownId = `POINTS_${message.author.id}@${message.guild.id}`;
        client.cooldowns.set(cooldownId, Date.now());

        const handler = await messageHandler(client, message);
        expect(handler).toBeUndefined();
    });

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

    it("should add EXP if module is enabled", async () => {
        client.db.userUtils.getUserLocale.mockResolvedValue({ lang: "en" });
        getNumberInRange.mockReturnValue(10); // Mocking the getNumberInRange function to return a fixed value
        const testValue = ["2.5"];
        client.db.redis.sMembers.mockResolvedValue(testValue);
        const accumulatedExpMultiplier = testValue.length > 0 ? 1 + testValue.reduce((p, c) => p + parseFloat(c), 0) : 1;
        await messageHandler(client, message);
        await new Promise(process.nextTick);
        expect(client.db.userUtils.getUserLocale).toHaveBeenCalledWith(message.author.id);
        expect(client.experienceLibs).toHaveBeenCalledWith(message.member, message.guild, message.channel, expect.any(Function));
        expect(executeMock).toHaveBeenCalledWith(10 * accumulatedExpMultiplier);
    });
});