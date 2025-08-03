const { messageHandler } = require("../src/events/messageCreate.js");
const { getMessageMock, getClientMock } = require("../__mocks__/index.js");

describe("Message Handler", () => {

    const message = getMessageMock()
    const client = getClientMock()

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("it should return if client isn't ready", async () => {
        client.isReady.mockReturnValue(false);
        await messageHandler(client, message);
        expect(client.isReady).toHaveBeenCalledTimes(1)
        expect(client.isReady).toHaveReturnedWith(false);
        expect(message.channel.send).not.toHaveBeenCalled();
    });

    it("should return when a bot sends a message", async () => {
        message.author.bot = true;
        await messageHandler(client, message);
        expect(message.channel.send).not.toHaveBeenCalled();
    });

    it("should return when the message is from a DM channel", async () => {
        message.channel.isDMBased.mockReturnValue(true);
        await messageHandler(client, message);
        console.log(message.channel.isDMBased())
        expect(message.channel.isDMBased).toHaveBeenCalledTimes(1);
        expect(message.channel.isDMBased).toHaveReturnedWith(true);
        expect(message.channel.send).not.toHaveBeenCalled();
    });
});