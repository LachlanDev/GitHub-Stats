const chalk = require("chalk")
const config = require("../cfg/config.json")
module.exports = (client) => {
    console.log(chalk.magenta(`Bot Made by LachlanDev#8014 \nPrefix is ${config.prefix}`));
  }