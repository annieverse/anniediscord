const { expect } = require(`chai`)
const sinon = require(`sinon`)
const fs = require(`fs`)
const { getTargetLocales, Localization } = require(`../../src/libs/localizer`)

// Mock locale content
const mockLocales = {
  'en.json': {
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

describe(`Localizer Library`, () => {
  let sandbox
  let readdirStub
  let requireStub

  beforeEach(() => {
    // Create a sinon sandbox for test isolation
    sandbox = sinon.createSandbox()
    
    // Stub fs.readdirSync
    readdirStub = sandbox.stub(fs, `readdirSync`).returns([`en.json`, `fr.json`])
    
    // Stub require for locale files
    requireStub = sandbox.stub(require(`module`), `_load`)
    requireStub.withArgs(`../locales/en.json`).returns(mockLocales[`en.json`])
    requireStub.withArgs(`../locales/fr.json`).returns(mockLocales[`fr.json`])
    requireStub.callThrough()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe(`getTargetLocales`, () => {
    it(`should return locales for target language when available`, () => {
      const locales = getTargetLocales(`fr`)
      expect(locales).to.have.property(`REQUEST_PING`, `**Pong !** {{emoji}}\n╰ reçu en {{ping}} ms !`)
      expect(locales).to.have.nested.property(`SAY.SHORT_GUIDE`, `Veuillez inclure le message que vous souhaitez que je lise ! {{emoji}}`)
    })

    it(`should fallback to default language when target language not available (enforced)`, () => {
      const locales = getTargetLocales(`uwu`, `en`)
      expect(locales).to.have.property(`REQUEST_PING`, `**Pong!** {{emoji}}\n╰ received in {{ping}} ms!`)
      expect(locales).to.have.nested.property(`SAY.SHORT_GUIDE`, `Please include the message that you want me to read! {{emoji}}`)
    })

    it(`should fallback to default language when target language not available (by default)`, () => {
      const locales = getTargetLocales(`uwu`)
      expect(locales).to.have.property(`REQUEST_PING`, `**Pong!** {{emoji}}\n╰ received in {{ping}} ms!`)
      expect(locales).to.have.nested.property(`SAY.SHORT_GUIDE`, `Please include the message that you want me to read! {{emoji}}`)
    })

    it(`should handle case-insensitive language codes`, () => {
      const locales = getTargetLocales(`FR`, `en`)
      expect(locales).to.have.property(`REQUEST_PING`, `**Pong !** {{emoji}}\n╰ reçu en {{ping}} ms !`)
      expect(locales).to.have.nested.property(`SAY.SHORT_GUIDE`, `Veuillez inclure le message que vous souhaitez que je lise ! {{emoji}}`)
    })
  })

  describe(`Localization Class`, () => {
    let localizer
    let consoleErrorSpy

    beforeEach(() => {
      consoleErrorSpy = sandbox.spy(console, `error`)
      localizer = new Localization()
    })

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

    it(`should log error when key is not found in both fallback and current languages`, () => {
      localizer.lang = `fr`
      localizer.findLocale(`THIS.KEY._DOES_NOT_EXIST`)
      expect(consoleErrorSpy.calledOnce).to.be.true
      expect(consoleErrorSpy.args[0][0]).to.equal(
        `The specified key is not an available language path.\nKey supplied and tried > THIS.KEY._DOES_NOT_EXIST`
      )
    })

    it(`should fallback to 'en' version when key not found in other language`, () => {
      localizer.lang = `fr`
      const msg = localizer.findLocale(`EN_EXCLUSIVE`)
      expect(msg).to.equal(`This is an exclusive message for English only!`)
    })

    it(`should properly initialize pool for each locale`, () => {
      localizer.lang = `en`
      const msg = localizer.findLocale(`REQUEST_PING`)
      expect(msg).to.equal(`**Pong!** {{emoji}}\n╰ received in {{ping}} ms!`)
      expect(localizer.findLocale(`REQUEST_PING`)).to.equal(`**Pong!** {{emoji}}\n╰ received in {{ping}} ms!`)
    })
  })
})
