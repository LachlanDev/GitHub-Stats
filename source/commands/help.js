const discord = require ("discord.js");
const client = new discord.Client();
const chalk = require("chalk");
exports.run = (client, message, args) =>{
    const help = new discord.MessageEmbed()
    .setColor('#b434eb')
    .setTitle('GitHub Stats - Help')
    .setURL("https://github.com/PapaSnags/GitHub-Stats")
    .addFields(
        {name: "Profile", value: "Lookup a GitHub user's profile displaying their information. \n **Usage:** g!profile PapaSnags \n"},
        {name: "Repository", value: "Lookup information about a repository. \n **Usage:** g!repo PapaSnags GitHub-Stats \n"},
        {name: "Help", value: "Sends This Help Message \n **Usage:** g!help\n"}
        )
    .setFooter("GitHub Stats BOT Made by PapaSnags#1555", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
    message.channel.send({embed: help })

};
