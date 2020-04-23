const { Canvas } = require(`canvas-constructor`) 
const { resolve, join } = require(`path`)

Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), `roboto-thin`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-light.ttf`)),`roboto-light`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `roboto-medium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), `roboto-bold`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-black.ttf`)), `roboto-black`)

module.exports = Canvas