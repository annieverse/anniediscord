const canvas = require(`canvas`) 
const { resolve, join } = require(`path`)
const { Canvas } = require(`canvas-constructor`) 
canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), {"family":`roboto-thin`})
canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-light.ttf`)),{"family":`roboto-light`})
canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), {"family":`roboto-medium`})
canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), {"family":`roboto-bold`})
canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-black.ttf`)), {"family":`roboto-black`})

module.exports = Canvas