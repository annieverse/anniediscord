class RollDice {
    constructor(Stacks) {
        this.stacks = Stacks
        this.amount = 1
        this.numOfSides = 6
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

    get roll(){
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

    get getrollAmount(){
        return this.amount
    }

    get rollSelected(){
        var result = []
        for (let index = 0; index < this.amount; index++) {
            let number = index
            number++
            let numberWord = this.numToWord(number.toString())
            result.push(`your roll ${numberWord} is **${this.roll}**`)
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
    set setNumOfSides(num){
        this.numOfSides = num
    }

    async execute() {
        const { reply, args } = this.stacks

        if (!args[0] || !args[0].includes(`d`)) return reply(`please use this command like: >rd d6 or >rd 2d6\n >rd <amount of dice to roll>d<amount of sides on the dice>`)

        let diceOptions = args[0].split(`d`)
        !diceOptions[0] ? this.rollAmount = 1 : this.rollAmount = diceOptions[0]
        this.setNumOfSides = diceOptions[1]
        
        return reply(this.rollSelected.join(`\n`))
    }
}

module.exports.help = {
    start: RollDice,
    name: `rolldice`,
    aliases: [`diceroll`,`rd`],
    description: `retrives a random roll`,
    usage: `rolldice`,
    group: `fun`,
    public: true,
    required_usermetadata: false,
    multi_user: false,
    special_channels: `630283310496612352`
}