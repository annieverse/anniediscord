const { expect } = require(`chai`)
const sinon = require(`sinon`)
const fs = require(`fs`)
// Mock locale content
const mockLocales = {
  'en.json': {
    "LOCALE_NOT_FOUND": "I seem to have forgotten what I wanted to say, please report this to my developers.",
    "REQUEST_PING": `**Pong!** {{emoji}}\n╰ received in {{ping}} ms!`,
    "SAY": {
      "SHORT_GUIDE": `Please include the message that you want me to read! {{emoji}}`
    },
    "EN_EXCLUSIVE": `This is an exclusive message for English only!`
  },
  'fr.json': {
    "REQUEST_PING": `**Pong !** {{emoji}}\n╰ reçu en {{ping}} ms !`,
    "SAY": {
      "SHORT_GUIDE": `Veuillez inclure le message que vous souhaitez que je lise ! {{emoji}}`
    }
  }
}

const logger = {
  error: sinon.stub(),
  warn: sinon.stub(),
  info: sinon.stub(),
  debug: sinon.stub()
}

const Module = require(`module`)
const originalRequire = Module.prototype.require
Module.prototype.require = function(...args) {
  if (args[0] === `../../pino.config`) {
    return { localizerLogger: logger }
  }
  
  // Handle locale JSON files
  if (args[0].endsWith(`en.json`)) {
    return mockLocales[`en.json`]
  }
  if (args[0].endsWith(`fr.json`)) {
    return mockLocales[`fr.json`]
  }
  
  return originalRequire.apply(this, args)
}

const { Localization } = require(`../../src/libs/localizer`)
describe(`Localizer Library`, () => {
  let sandbox
  let requireStub
  let readdirStub

  beforeEach(() => {
    // Create a sinon sandbox for test isolation
    sandbox = sinon.createSandbox()

    logger.error.resetHistory()
    logger.warn.resetHistory()
    logger.info.resetHistory()
    logger.debug.resetHistory()

    // Stub fs.readdirSync
    sandbox.stub(fs, `readdirSync`).returns([`en.json`, `fr.json`])
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe(`Localization Class`, () => {
    let localizer

    beforeEach(() => 
      localizer = new Localization()
    )

    it(`should initialize with correct available locales ids`, () => {
      expect(localizer.availableLocales).to.deep.equal({
        "english": `en`,
        "french": `fr`
      })
    })

    it(`should allow setting and getting language`, () => {
      localizer.lang = `fr`
      expect(localizer.lang).to.equal(`fr`)
    })

    it(`should prevent non-string locale key to lookup, then return placeholderFallback message`, () => {
      localizer.lang = `en`
      // Test with null
      const nonStringKey = localizer.findLocale(null)
      expect(logger.error.calledOnce).to.be.true
      expect(logger.error.firstCall.args[0]).to.deep.equal({
        action: `invalid_locale_key`,
        type: `object`,
        key: null
      })
      expect(nonStringKey).to.equal(`**i'm sorry !!** there seems to be an issue with the availability of my localized message. kindly help reporting this to my developers [in the support server.](https://discord.gg/HjPHCyG346) ; ;`)
    })

    it(`should find locale by key (1-level deep) with current language`, () => {
      localizer.lang = `en`
      const msg = localizer.findLocale(`REQUEST_PING`)
      expect(msg).to.equal(`**Pong!** {{emoji}}\n╰ received in {{ping}} ms!`)
    })

    it(`should find locale by key (2-level deep) with current language`, () => {
      localizer.lang = `en`
      const msg = localizer.findLocale(`SAY.SHORT_GUIDE`)
      expect(msg).to.equal(`Please include the message that you want me to read! {{emoji}}`)
    })
    
    it(`should log error when key is not found in target origin and fallback language`, () => {
      localizer.lang = `fr`
      localizer.fallback = `en`
      localizer.findLocale(`THIS.KEY._DOES_NOT_EXIST`)
      expect(logger.warn.callCount).to.equal(2)
      expect(logger.warn.firstCall.args[0]).to.deep.equal({
        action: `origin_locale_missing`,
        lang: `fr`,
        key: `THIS.KEY._DOES_NOT_EXIST`
      })
      expect(logger.warn.secondCall.args[0]).to.deep.equal({
        action: `fallback_locale_missing`,
        lang: `en`,
        key: `THIS.KEY._DOES_NOT_EXIST`
      })
    })

    it(`should fallback to 'en' version when key not found in other language`, () => {
      localizer.lang = `fr`
      const msg = localizer.findLocale(`EN_EXCLUSIVE`)
      expect(msg).to.equal(`This is an exclusive message for English only!`)
    })
  })
})