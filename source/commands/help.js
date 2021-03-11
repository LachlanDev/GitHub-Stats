const discord = require ("discord.js");

exports.run = (client, message, args) =>{
    const help = new discord.MessageEmbed()
    .setColor('#b434eb')
    .setTitle('GitHub Stats - Help')
    .setURL("https://github.com/LachlanDev/GitHub-Stats")
    .addFields(
        {name: "Profile", value: "Lookup a GitHub user's profile displaying their information. \n **Usage:** g!profile LachlanDev \n"},
        {name: "Repositories", value: "Lookup a GitHub user's repositories. (Sorted by created date) \n **Usage:** g!repo LachlanDev\n"},
        {name: "Help", value: "Sends This Help Message \n **Usage:** g!help\n"}
        )
    .setFooter("GitHub Stats BOT Made by LachlanDev#8014 v1.4", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
    message.channel.send({embed: help })

};
