"use strict"
const moment = require(`moment`)
const User = require(`./user.js`)
const commanifier = require(`../utils/commanifier.js`)
class Quest {

    // Declare private variables
    #sessionId
    #user
    #locale
    #messageRef
    #userData
    #nextQuestId
    #newNextQuestId
    #activeQuest
    #sessionActive
    #userAnswer
    #quests
    #questAvailable
    #questReward
    #questAnswer
    #questTitle
    #questDescription
    #questFormattedReward
    #answerIsCorrect
    #questlocalePool

    constructor(client, reply) {
        this.client = client
        this.reply = reply
    }

    set #setNextQuestId(id) {
        this.#nextQuestId = id
        if (!this.#nextQuestId) {
            this.#nextQuestId = this.#generateNextQuestId()
            this.client.db.quests.updateUserNextActiveQuest(this.#user.id, this.#messageRef.guild.id, this.#nextQuestId, this.#locale.lang)
        }
        this.#setActiveQuest = this.#nextQuestId
    }

    set #setActiveQuest(a) {
        if (!this.#questlocalePool[this.#locale.lang].length) {
            this.#activeQuest = this.#questlocalePool.en.find(node => node.quest_id === a)
        } else {
            let attemptedQuest
            try {
                attemptedQuest = this.#questlocalePool[this.#locale.lang].find(node => node.quest_id === a)
            } catch (error) {
                attemptedQuest = this.#questlocalePool.en.find(node => node.quest_id === a)
            }
            if (attemptedQuest === undefined) attemptedQuest = this.#questlocalePool.en.find(node => node.quest_id === a)
            this.#activeQuest = attemptedQuest
        }
    }

    set #setUserAnswer(a) {
        this.#userAnswer = a.toLowerCase()
    }

    set #setQuestAnswer(a) {
        this.#questAnswer = a.toLowerCase()
    }

    get getSessionActive() {
        return this.#sessionActive
    }

    get getQuestAvailable() {
        return this.#questAvailable
    }

    get getQuestTitle() {
        return this.#questTitle
    }

    get getQuestDescription() {
        return this.#questDescription
    }

    get getQuestFormattedReward() {
        return this.#questFormattedReward
    }

    get getAnswerIsCorrect() {
        return this.#answerIsCorrect
    }

    async start(sessionId, user, locale, msgRef) {
        this.#sessionId = sessionId
        this.#user = user
        this.#locale = locale
        this.#messageRef = msgRef
        this.#userData = await (new User(this.client, this.#messageRef)).requestMetadata(this.#user, 2, this.#locale)

        // Check for if a session is running already or if the time limit is up
        this.#sessionActive = await this.#checkSession()
        if (this.#sessionActive === true) return
        this.#questAvailable = await this.#checkIfQuestAvailable()
        if (this.#questAvailable === false) return

        await this.#fetchQuests()
        this.#fetchQuestlocalePool()

        this.#newNextQuestId = this.#generateNextQuestId()
        this.#setNextQuestId = this.#userData.quests.next_quest_id

        this.#questTitle = this.#langQuestProp(`name`)
        this.#questDescription = this.#langQuestProp(`description`)
        this.#setQuestAnswer = this.#langQuestProp(`correct_answer`)

        this.#questReward = this.#activeQuest.reward_amount
        this.#questFormattedReward = `${await this.client.getEmoji(`758720612087627787`)}${commanifier(this.#questReward)}`
    }

    cancelSession() {
        return this.client.db.databaseUtils.delCache(this.#sessionId)
    }

    testAnswer(a) {
        a = a.toLowerCase()
        if (a.startsWith((this.client.prefix))) a = a.slice(1)
        this.#setUserAnswer = a

        if (this.#userAnswer !== this.#questAnswer) return this.#answerIsCorrect = false

        return this.#answerIsCorrect = true
    }

    updateRewards() {
        //  Update reward, user quest data and store activity to quest_log activity
        this.client.db.databaseUtils.updateInventory({ itemId: 52, value: this.#questReward, guildId: this.#messageRef.guild.id, userId: this.#user.id })
        this.client.db.quests.updateUserQuest(this.#user.id, this.#messageRef.guild.id, this.#newNextQuestId, this.#locale.lang)
        this.client.db.quests.recordQuestActivity(this.#nextQuestId, this.#user.id, this.#messageRef.guild.id, this.#userAnswer, this.#locale.lang)
        this.cancelSession()
    }

    #generateNextQuestId() {
        const questIdsPool = this.#quests.map(q => q.quest_id)
        return questIdsPool[Math.floor(Math.random() * questIdsPool.length)] || 1
    }


    async #fetchQuests() {
        const q = await this.client.db.quests.getAllQuests()
        if (!q.length) {
            await this.reply.send(this.#locale.QUEST.EMPTY)
            return false
        }
        return this.#quests = q
    }

    #fetchQuestlocalePool() {
        // Try to grab the correct language file, if it fails fallback to en
        let questlocale = {}
        questlocale.en = this.#quests.filter(q => q.lang == `en`)
        try {
            if (this.#locale.lang != `en`) questlocale[this.#locale.lang] = this.#quests.filter(q => q.lang == this.#locale.lang)
        } catch (error) {
            this.client.logger.warn(`[quests.js] Could not load "${this.#locale.lang}" lang for quests`)
        }
        return this.#questlocalePool = questlocale
    }


    /**
     * check the user's session and set set one if ones not running
     * @returns {Promise | Boolean}
     */
    async #checkSession() {
        if (this.client.dev) return false

        if (await this.client.db.databaseUtils.doesCacheExist(this.#sessionId)) {
            await this.reply.send(this.#locale.QUEST.SESSION_STILL_RUNNING, { socket: { emoji: await this.client.getEmoji(`692428748838010970`) } })
            return true
        }
        //  Session up for 2 minutes
        this.client.db.databaseUtils.setCache(this.#sessionId, `1`, { EX: 60 * 2 })
        return false
    }

    async #checkIfQuestAvailable() {
        const now = moment()
        const cooldown = [2, `hours`]
        const lastClaimAt = await this.client.db.systemUtils.toLocaltime(this.#userData.quests.updated_at)
		const localed = lastClaimAt == `now` ? moment().toISOString() : lastClaimAt
        //  Handle if user's quest queue still in cooldown
        if (now.diff(localed, cooldown[1]) < cooldown[0]) {
            await this.reply.send(this.#locale.QUEST.COOLDOWN, {
                topNotch: `**Shall we do something else first?** ${await this.client.getEmoji(`692428969667985458`)}`,
                thumbnail: this.#user.displayAvatarURL(),
                socket: {
                    time: moment(localed).add(...cooldown).fromNow(),
                    prefix: this.client.prefix
                },
            })
            return false
        }
        return true
    }

    /**
     * Try to return the correct property from the object and fall back to en if the this.#locale isnt available
     * @param {Object} lang 
     * @param {Object} langSource 
     * @param {Object} quest_id 
     * @param {Object} prop 
     * @returns 
     */
    #langQuestProp(prop) {
        if (prop != `name` && prop != `description` && prop != `correct_answer`) throw new TypeError(`[quest.js][langQuestProp] parmeter prop can only be "name" or "description"`)
        try {
            if (!this.#activeQuest[prop]) throw Error(`Quest lang prop not populated`)
        } catch (error) {
            return this.#questlocalePool.en[this.#nextQuestId][prop]
        }
        return this.#activeQuest[prop]
    }
}

module.exports = Quest