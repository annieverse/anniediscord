const Heart = require(`../utils/artFeaturingManager`)
const Classroom = require(`../utils/classroomManager`)

module.exports = async(Components) => {
    new Heart(Components).Add()
    Classroom(Components)
}