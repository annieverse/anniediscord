`use strict`

const { expect } = require(`chai`)
const sinon = require(`sinon`)
const pingCommand = require(`../../src/commands/system/ping`)

describe(`Ping Command`, () => {
  let clientMock, replyMock, localeMock, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    // Mock client
    clientMock = {
      ws: {
        ping: 42
      },
      getEmoji: sandbox.stub().resolves(`this is emoji`)
    }
    // Mock reply handler
    replyMock = {
      send: sandbox.stub().resolves({})
    }
    // Mock locale function
    localeMock = sandbox.stub().returns(`this is localized message.`)
  })
  
  afterEach(() => {
    sandbox.restore()
  })
  
  describe(`Command Structure`, () => {
    it(`should have the correct properties`, () => {
      expect(pingCommand.name).to.equal(`ping`)
      expect(pingCommand.permissionLevel).to.equal(0)
      expect(pingCommand.applicationCommand).to.be.true
      expect(pingCommand.messageCommand).to.be.true
    })
  })
  
  describe(`getPing()`, () => {
    it(`should return formatted ping value`, () => {
      const result = pingCommand.getPing(clientMock)
      expect(result).to.equal(`42`)
      expect(Math.floor(clientMock.ws.ping)).to.equal(42)
    })
    
    it(`should handle decimal ping values`, () => {
      clientMock.ws.ping = 123.45
      expect(pingCommand.getPing(clientMock)).to.equal(`123`)
    })
  })
  
  describe(`run()`, () => {
    it(`should send a localized message with formatted ping`, async () => {
      sandbox.stub(pingCommand, `getPing`).returns(`42`)
      await pingCommand.run(clientMock, replyMock, localeMock)
      expect(localeMock.calledWith(`REQUEST_PING`)).to.be.true
      expect(replyMock.send.calledOnce).to.be.true
    })
  })
  
  describe(`execute()`, () => {
    it(`should call run with the correct parameters`, async () => {
      const runSpy = sandbox.spy(pingCommand, `run`)
      const message = {}
      const arg = `test`
      await pingCommand.execute(clientMock, replyMock, message, arg, localeMock)
      expect(runSpy.calledOnce).to.be.true
      expect(runSpy.calledWith(clientMock, replyMock, localeMock)).to.be.true
    })
  })
  
  describe(`Iexecute()`, () => {
    it(`should call run with the correct parameters`, async () => {
      const runSpy = sandbox.spy(pingCommand, `run`)
      const interaction = {}
      const options = {}
      await pingCommand.Iexecute(clientMock, replyMock, interaction, options, localeMock)
      expect(runSpy.calledOnce).to.be.true
      expect(runSpy.calledWith(clientMock, replyMock, localeMock)).to.be.true
    })
  })
})