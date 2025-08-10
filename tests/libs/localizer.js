const { expect } = require(`chai`)
const sinon = require(`sinon`)
const fs = require(`fs`)
const { Localization } = require(`../../src/libs/localizer`)

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

describe(`Localizer Library`, () => {
  let sandbox
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

    // it(`should log error when key is not found in both fallback and current languages`, () => {
    //   localizer.lang = `fr`
    //   localizer.findLocale(`THIS.KEY._DOES_NOT_EXIST`)
    //   expect(consoleErrorSpy.calledOnce).to.be.true
    //   /**
    //    * Explanation of the regex:
    //    * ^: Matches the beginning of the string.
    //    * (Mon|Tue|Wed|Thu|Fri|Sat|Sun): Matches the three-letter abbreviation for the day of the week.
    //    * \s: Matches a single whitespace character.
    //    * (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec): Matches the three-letter abbreviation for the month.
    //    * \s: Matches a single whitespace character.
    //    * (\d{2}): Matches the two-digit day of the month.
    //    * \s: Matches a single whitespace character.
    //    * (\d{4}): Matches the four-digit year.
    //    * \s: Matches a single whitespace character.
    //    * (\d{2}:\d{2}:\d{2}): Matches the time in HH:MM:SS format.
    //    * \sGMT[+-]\d{4}: Matches " GMT" followed by a plus or minus sign and a four-digit offset (e.g., "+0500").
    //    * \s\(.+\): Matches a space, an opening parenthesis, any character (except newline) one or more times, and a closing parenthesis, representing the timezone name (e.g., "(Coordinated Universal Time)").
    //    */
    //   const dateRegex = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2})\s(\d{4})\s(\d{2}:\d{2}:\d{2})\sGMT[+-]\d{4}\s\(.+\)/
    //   const expectedMessage = ` | The specified key is not an available language path.\nKey supplied and tried > THIS.KEY._DOES_NOT_EXIST`
    //   expect(consoleErrorSpy.args[0][0]).to.match(dateRegex).and.to.include(expectedMessage)
    // })

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
