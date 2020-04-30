const Command = require(`../../libs/commands`)
/**
 * @todo
 * Hi @Bait_god, would you mind to refactor this code?
 * IMO, the options are a bit overwhelming, should we try to add a simpler dice option?
 * Example, if user doesn't specify any argument, Annie will use the common rolldice method a.k.a randomize number from 1 to 6.
 * 
 * Retrieves a random roll
 * @author Bait God
 */
class RollDice extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.amount = 1
        this.numOfSides = 6
        this.modifier = null
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply }) {

        if (!this.args[0] || !this.args[0].includes(`d`)) return reply(this.locale.ROLLDICE.MISSING_ARGS)
        let diceOptions = this.fullArgs.split(`d`)
        let modiferPlus, modiferMinus
        if (diceOptions[1].includes(`+`)) {
            modiferPlus = diceOptions[1].split(`+`)
            this.modifier = ` + ${modiferPlus[1]}`
            this.setNumOfSides = modiferPlus[0]
        } else if (diceOptions[1].includes(`-`)) {
            modiferMinus = diceOptions[1].split(`-`)
            this.modifier = ` - ${modiferMinus[1]}`
            this.setNumOfSides = modiferMinus[0]
        } else {
            this.setNumOfSides = diceOptions[1]
        }
        !diceOptions[0] ? this.rollAmount = 1 : this.rollAmount = diceOptions[0]
        return reply(this.rollSelected.join(`\n`))
    }

    numToWord(args) {
        var a = [``, `one `, `two `, `three `, `four `, `five `, `six `, `seven `, `eight `, `nine `, `ten `, `eleven `, `twelve `, `thirteen `, `fourteen `, `fifteen `, `sixteen `, `seventeen `, `eighteen `, `nineteen `]
        var b = [``, ``, `twenty`, `thirty`, `forty`, `fifty`, `sixty`, `seventy`, `eighty`, `ninety`]

        function inWords(num) {
            if ((num = num.toString()).length > 9) return `overflow`
            let n = (`000000000` + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)
            if (!n) return
            var str = ``
            str += (n[5] != 0) ? ((str != ``) ? `and ` : ``) + (a[Number(n[5])] || b[n[5][0]] + ` ` + a[n[5][1]]) : ``
            return str
        }

        return inWords(args)
    }

    get roll() {
        var dice = {
            sides: this.numOfSides,
            roll: function () {
                var randomNumber = Math.floor(Math.random() * this.sides) + 1
                randomNumber = Math.floor(Math.random() * this.sides) + 1
                return randomNumber
            }
        }
        return dice.roll()
    }

    get getrollAmount() {
        return this.amount
    }

    get rollSelected() {
        var result = []
        for (let index = 0; index < this.amount; index++) {
            let number = index
            number++
            let numberWord = this.numToWord(number.toString())
            if (this.modifier == null) {
                result.push(`your roll ${numberWord} is **${this.roll}**`)
            } else {
                let roll = this.roll
                let modifier = parseInt(this.modifier.slice(3))
                let total
                if (this.modifier.trim().startsWith(`+`)){
                    total = roll + modifier
                } else if (this.modifier.trim().startsWith(`-`)) {
                    total = roll - modifier
                }
                result.push(`your roll ${numberWord} is **${roll}** ${this.modifier} => **${total}**`)
            }
        }
        return result
    }

    /**
     * @param {number} num
     */
    set rollAmount(num) {
        this.amount = num
    }

    /**
     * @param {number} num
     */
    set setNumOfSides(num) {
        this.numOfSides = num
    }

}

module.exports.help = {
    start: RollDice,
    name: `rolldice`,
    aliases: [`diceroll`, `rd`],
    description: `Retrieves a random roll`,
    usage: `rolldice <AmountOfDice>`,
    group: `Fun`,
    permissionLevel: 0,
    multiUser: false,
}