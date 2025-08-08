const { messageHandler } = require("../src/events/messageCreate.js");
const { getMessageMock, getClientMock } = require("../__mocks__/index.js");

describe("Message Handler", () => {

    let message
    let client

    /**
     * Make the parameters state reset once on every test scope.
     * This way we avoid accidental global mutation by always redefining the state.
     * Stateless and stays within local-scope.
     */
    beforeEach(() => {
        jest.clearAllMocks();
        message = getMessageMock();
        client = getClientMock();
    });

    it("it should return if client isn't ready", async () => {
        client.isReady.mockReturnValue(false);
        await messageHandler(client, message);
        expect(client.isReady).toHaveBeenCalledTimes(1)
        expect(client.isReady).toHaveReturnedWith(false);
        expect(message.channel.send).not.toHaveBeenCalled();
    });

    it("should return when a bot sends a message", async () => {
        client.isReady.mockReturnValue(true);
        message.author.bot = true;
        await messageHandler(client, message);
        expect(message.channel.send).not.toHaveBeenCalled();
    });

    it("should return when the message is from a DM channel", async () => {
        client.isReady.mockReturnValue(true);
        message.author.bot = true;
        message.channel.isDMBased.mockReturnValue(true);
        await messageHandler(client, message);
        console.log(message.channel.isDMBased())
        expect(message.channel.isDMBased).toHaveBeenCalledTimes(1);
        expect(message.channel.isDMBased).toHaveReturnedWith(true);
        expect(message.channel.send).not.toHaveBeenCalled();
    });
});