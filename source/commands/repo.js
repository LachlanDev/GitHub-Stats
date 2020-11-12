const discord = require ("discord.js");
const client = new discord.Client();
const chalk = require("chalk");

exports.run = (client, message, args) =>{
    var request = require("request");
    // GitHub API Request
    var options = {
      method: 'GET',
      url: `https://api.github.com/repos/${args[0]}/${args[1]}/releases/latest`,
      headers: {
        'User-Agent': 'GitHub-Stats-PapaSnags',
        useQueryString: true
      }
    };
    // Number format (K M B )
    const numformat = n => {
        if (n < 1e3) return n;
        if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
        if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
        if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
        if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
        };

    request(options, function (error, response, body) {
        try 
        {
          jsonprased = JSON.parse(body)
        } 
        catch (e) 
        {
          const error = new discord.MessageEmbed()
          .setColor('#b434eb')
          .addField('An Error Has occured', `Please try again, or contact PapaSnags#1555`)
          .setFooter("GitHub Stats BOT Made by PapaSnags#1555", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
          message.channel.send({embed: error })
          return
        }
        
    if(jsonprased.message == "Not Found")
    {
        const usernf = new discord.MessageEmbed()
        .setColor('#b434eb')
        .addField('Repo Not Found', `Please try again and check the spelling.`)
        .setFooter("GitHub Stats BOT Made by PapaSnags#1555", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
        message.channel.send({embed: usernf })
        return
    }
    else
    {   
        try
        {
            const profile = new discord.MessageEmbed()
            .setColor('#b434eb')
            .setTitle(`GitHub Repo Info - ${jsonprased.author.login}-${args[1]}`)
            .setURL(`https://github.com/${jsonprased.author.login}/${args[1]}`)
            .addField("Repo Name", `${args[1]}`, true)
            .addField("Made By", `${jsonprased.author.login}`,true) 
            .addField("Created Date:",`${jsonprased.assets[0].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0])
            .addFields(
                {name: "Release Name:", value: `${jsonprased.name}`,inline: true},
                {name: "Release Tag:", value: `${jsonprased.tag_name}`,inline: true},
                {name: "Download Count:", value: `${jsonprased.assets[0].download_count}`,inline: true},
                )
            .setFooter("GitHub Stats BOT Made by PapaSnags#1555", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
            message.channel.send({embed: profile })      
        }
        catch (e)
        {
            const error = new discord.MessageEmbed()
            .setColor('#b434eb')
            .addField('An Error Has occured', `Please try again, or contact PapaSnags#1555`)
            .setFooter("GitHub Stats BOT Made by PapaSnags#1555", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
            message.channel.send({embed: error })
        }
    }
})};
