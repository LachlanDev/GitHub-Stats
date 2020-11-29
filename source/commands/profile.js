const discord = require ("discord.js");

exports.run = (client, message, args) =>{
    var request = require("request");
    // GitHub API Request
    var options = {
      method: 'GET',
      url: `https://api.github.com/users/${args[0]}`,
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
          .setFooter("GitHub Stats BOT Made by PapaSnags#1555 v1.4", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
          message.channel.send({embed: error })
          return
        }
  
    if(jsonprased.message == "Not Found")
    {
        const usernf = new discord.MessageEmbed()
        .setColor('#b434eb')
        .addField('User Not Found', `Please try again and check the spelling.`)
        .setFooter("GitHub Stats BOT Made by PapaSnags#1555 v1.4", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
        message.channel.send({embed: usernf })
        return
    }
    else
    {   
        try
        {
            if(jsonprased.blog == "")
            {
                const profile = new discord.MessageEmbed()
                .setColor('#b434eb')
                .setTitle(`User Info - @${jsonprased.login}`)
                .setURL(`https://github.com/${jsonprased.login}`)
                .setThumbnail(jsonprased.avatar_url)
                .addField("Username", `${jsonprased.login}`, true)
                .addField("Name", `${jsonprased.name}`, true)
                .addField("Bio", `${jsonprased.bio}`)
                .addField('Location', `${jsonprased.location}`)
                .addField('Website:', "None")
                .addField('Repo Count:', numformat(jsonprased.public_repos), true)
                .addField('Followers', numformat(jsonprased.followers), true)
                .addField('Following', numformat(jsonprased.following), true)
                .addField('Joined:',`${jsonprased.created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0])
                .setFooter("GitHub Stats BOT Made by PapaSnags#1555 v1.4", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
                message.channel.send({embed: profile })   
            }
            else
            {
                const profile = new discord.MessageEmbed()
                .setColor('#b434eb')
                .setTitle(`GitHub User Info - @${jsonprased.login}`)
                .setURL(`https://github.com/${jsonprased.login}`)
                .setThumbnail(jsonprased.avatar_url)
                .addField("Username", `${jsonprased.login}`, true)
                .addField("Name", `${jsonprased.name}`, true)
                .addField("Bio", `${jsonprased.bio}`)
                .addField('Location', `${jsonprased.location}`)
                .addField('Website:', `${jsonprased.blog}`)
                .addField('Repo Count:', numformat(jsonprased.public_repos), true)
                .addField('Followers', numformat(jsonprased.followers), true)
                .addField('Following', numformat(jsonprased.following), true)
                .addField('Joined:',`${jsonprased.created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0])
                .setFooter("GitHub Stats BOT Made by PapaSnags#1555 v1.4", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
                message.channel.send({embed: profile })    
            }    
        }
        catch (e)
        {
            const error = new discord.MessageEmbed()
            .setColor('#b434eb')
            .addField('An Error Has occured', `Please try again, or contact PapaSnags#1555`)
            .setFooter("GitHub Stats BOT Made by PapaSnags#1555 v1.4", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
            message.channel.send({embed: error })
        }
    }
})};
