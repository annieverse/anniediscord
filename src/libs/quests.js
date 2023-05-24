const moment = require(`moment`)
const User = require(`./user.js`)
const commanifier = require(`../utils/commanifier.js`)
class Quest {
    constructor(client, reply) {
        this.client = client
        this.reply = reply
    }
    get getSessionId() {
        return this.sessionId
    }

    set setSessionId(id) {
        this.sessionId = id
    }

    get getUser() {
        return this.user
    }

    set setUser(u) {
        this.user = u
    }

    get getLocale() {
        return this.locale
    }

    set setLocale(l) {
        this.locale = l
    }

    get getMessageRef() {
        return this.messageRef
    }

    set setMessageRef(m) {
        this.messageRef = m
    }

    get getUserData() {
        return this.userData
    }

    set setUserData(u) {
        this.userData = u
    }

    get getNextQuestId() {
        return this._nextQuestId
    }

    set setNextQuestId(id) {
        this._nextQuestId = id
        if (!this._nextQuestId) {
            this._nextQuestId = this.generateNextQuestId()
            this.client.db.quests.updateUserNextActiveQuest(this.user.id, this.messageRef.guild.id, this._nextQuestId)
        }
        this.setActiveQuest = this.quests.find(node => node.quest_id === this._nextQuestId)
    }

    get getGenNextQuestId() {
        return this.genNextQuestId
    }

    set setGenNextQuestId(i) {
        this.genNextQuestId = i
    }

    get getActiveQuest() {
        return this.activeQuest
    }

    set setActiveQuest(a) {
        this.activeQuest = a
    }

    get getLangQuest() {
        return this.langQuest
    }

    set setlangQuest(lang) {
        try {
            if (!this.questlocalePool[lang]) throw Error(`Quest lang not populated`)
        } catch (error) {
            this.langQuest = this.questlocalePool.en
        }
        this.langQuest = this.questlocalePool[lang]
    }

    get getQuestTitle() {
        return this.questTitle
    }

    set setQuestTitle(t) {
        this.questTitle = t
    }

    get getQuestDescription() {
        return this.questDescription
    }

    set setQuestDescription(d) {
        this.questDescription = d
    }

    get getQuestAnswer() {
        return this.questAnswer
    }

    set setQuestAnswer(a) {
        this.questAnswer = a
    }

    get getQuestReward() {
        return this.questReward
    }

    set setQuestReward(r) {
        this.questReward = r
    }

    get getQuestFormattedReward() {
        return this.questRewardFormatted
    }

    set setQuestFormattedReward(r) {
        this.questRewardFormatted = r
    }

    get getQuestlocalePool() {
        return this.questlocale
    }

    set setQuestlocalePool(l) {
        this.questlocale = l
    }
    get getQuests() {
        return this.quests
    }

    set setQuests(q) {
        this.quests = q
    }

    get getSessionActive() {
        return this.sessionActive
    }

    set setSessionActive(b) {
        this.sessionActive = b
    }

    get getQuestAvailable() {
        return this.questAvailable
    }

    set setQuestAvailable(b) {
        this.questAvailable = b
    }

    get getUserAnswer() {
        return this.userAnswer
    }

    set setUserAnswer(a) {
        this.userAnswer = a
    }

    get getAnswerIsCorrect() {
        return this.answerIsCorrect
    }

    set setAnswerIsCorrect(a) {
        this.answerIsCorrect = a
    }
    fetchQuestlocalePool() {
        // Try to grab the correct language file, if it fails fallback to en
        let questlocale = {}
        questlocale.en = require(`./../quests/en.json`)
        try {
            if (this.locale.currentLang != `en`) questlocale[this.locale.currentLang] = require(`./../quests/${this.locale.currentLang}.json`)
        } catch (error) {
            this.client.logger.warn(`[quests.js] Could not load "${this.locale.currentLang}" lang for quests`)
        }
        return this.setQuestlocalePool = questlocale
    }

    /**
     * check the user's session and set set one if ones not running
     * @returns {Promise | Boolean}
     */
    async _checkSession() {
        if (this.client.dev) return false
        if (await this.client.db.redis.exists(this.sessionId)) {
            await this.reply.send(this.locale.QUEST.SESSION_STILL_RUNNING, { socket: { emoji: await this.client.getEmoji(`692428748838010970`) } })
            return true
        }
        //  Session up for 2 minutes
        this.client.db.redis.set(this.sessionId, 1, `EX`, 60 * 2)
        return false
    }

    async _checkIfQuestAvailable() {
        const now = moment()
        const cooldown = [2, `hours`]
        const lastClaimAt = await this.client.db.systemUtils.toLocaltime(this.userData.quests.updated_at)
        //  Handle if user's quest queue still in cooldown
        if (now.diff(lastClaimAt, cooldown[1]) < cooldown[0]) {
            await this.reply.send(this.locale.QUEST.COOLDOWN, {
                topNotch: `**Shall we do something else first?** ${await this.client.getEmoji(`692428969667985458`)}`,
                thumbnail: this.user.displayAvatarURL(),
                socket: {
                    time: moment(lastClaimAt).add(...cooldown).fromNow(),
                    prefix: this.client.prefix
                },
            })
            return false
        }
        return true
    }

    /**
     * Try to return the correct property from the object and fall back to en if the this.locale isnt available
     * @param {Object} lang 
     * @param {Object} langSource 
     * @param {Object} quest_id 
     * @param {Object} prop 
     * @returns 
     */
    _langQuestProp(prop) {
        if (prop != `name` && prop != `description` && prop != `answer`) throw new TypeError(`[quest.js][langQuestProp] parmeter prop can only be "name" or "description"`)
        try {
            if (!this.activeQuest[prop]) throw Error(`Quest lang prop not populated`)
        } catch (error) {
            return this.getQuestlocalePool.en[this._nextQuestId][prop]
        }
        return this.activeQuest[prop]
    }

    async fetchQuests() {
        const q = await this.client.db.quests.getAllQuests()
        if (!q.length) {
            await this.reply.send(this.locale.QUEST.EMPTY)
            return false
        }
        return this.quests = q
    }

    async start(sessionId, user, locale, msgRef) {
        this.setSessionId = sessionId
        this.setUser = user
        this.setLocale = locale
        this.setMessageRef = msgRef
        this.setUserData = await (new User(this.client, this.messageRef)).requestMetadata(this.user, 2, this.locale)

        this.setSessionActive = await this._checkSession()
        if (this.sessionActive === true) return
        this.setQuestAvailable = await this._checkIfQuestAvailable()
        if (this.questAvailable === false) return
        await this.fetchQuests()
        this.fetchQuestlocalePool()
        this.setGenNextQuestId = this.generateNextQuestId()
        this.setNextQuestId = this.userData.quests.next_quest_id
        this.setQuestTitle = this._langQuestProp(`name`)
        this.setQuestDescription = this._langQuestProp(`description`)
        this.setQuestAnswer = this._langQuestProp(`answer`)

        this.setQuestReward = this.activeQuest.reward_amount
        this.setQuestFormattedReward = `${await this.client.getEmoji(`758720612087627787`)}${commanifier(this.questReward)}`
    }

    testAnswer(a) {
        a = a.toLowerCase()
        if (a.startsWith((this.client.prefix))) a = a.slice(1)
        this.userAnswer = a

        if (this.userAnswer !== this.questAnswer) return this.answerIsCorrect = false

        return this.answerIsCorrect = true
    }

    cancelSession() {
        return this.client.db.redis.del(this.sessionId)
    }

    updateRewards() {
        //  Update reward, user quest data and store activity to quest_log activity
        this.client.db.databaseUtils.updateInventory({ itemId: 52, value: this.questReward, guildId: this.messageRef.guild.id, userId: this.user.id })
        this.client.db.quests.updateUserQuest(this.user.id, this.messageRef.guild.id, this.genNextQuestId)
        this.client.db.quests.recordQuestActivity(this._nextQuestId, this.user.id, this.messageRef.guild.id, this.userAnswer)
        this.cancelSession()
    }

    generateNextQuestId() {
        const questIdsPool = this.quests.map(q => q.quest_id)
        return questIdsPool[Math.floor(Math.random() * questIdsPool.length)] || 1
    }
}

module.exports = Quest