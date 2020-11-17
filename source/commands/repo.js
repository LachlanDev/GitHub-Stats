const discord = require ("discord.js");
const client = new discord.Client();
const chalk = require("chalk");
const Pagination = require('discord-paginationembed');

exports.run = (client, message, args) =>{
    var request = require("request");
    // GitHub API Request
    var options = {
      method: 'GET',
      url: `https://api.github.com/users/${args[0]}/repos?sort=created`,
      headers: {
        'User-Agent': 'GitHub-Stats-PapaSnags',
        useQueryString: true
      }
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
      .addField('User Not Found', `Please try again and check the spelling.`)
      .setFooter("GitHub Stats BOT Made by PapaSnags#1555", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
      message.channel.send({embed: usernf })
      return
    }
    else
    {
      try
      {
        async function send() 
        {
          if(jsonprased[0])
          {
            var val = [{ name: `${jsonprased[0].name}`, lang: `${jsonprased[0].language}`, desc: `${jsonprased[0].description}`, star: `${jsonprased[0].stargazers_count}`, watch: `${jsonprased[0].watchers_count}`, fork: `${jsonprased[0].forks}`, issu: `${jsonprased[0].open_issues_count}`, date: `${jsonprased[0].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}]
          }
          if(jsonprased[1])
          {
            var val = [{ name: `${jsonprased[0].name}`, lang: `${jsonprased[0].language}`, desc: `${jsonprased[0].description}`, star: `${jsonprased[0].stargazers_count}`, watch: `${jsonprased[0].watchers_count}`, fork: `${jsonprased[0].forks}`, issu: `${jsonprased[0].open_issues_count}`, date: `${jsonprased[0].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}, { name: `${jsonprased[1].name}`, lang: `${jsonprased[1].language}`, desc: `${jsonprased[1].description}`, star: `${jsonprased[1].stargazers_count}`, watch: `${jsonprased[1].watchers_count}`, fork: `${jsonprased[1].forks}`, issu: `${jsonprased[1].open_issues_count}`, date: `${jsonprased[1].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}]
          }
          if(jsonprased[2])
          {
            var val = [{ name: `${jsonprased[0].name}`, lang: `${jsonprased[0].language}`, desc: `${jsonprased[0].description}`, star: `${jsonprased[0].stargazers_count}`, watch: `${jsonprased[0].watchers_count}`, fork: `${jsonprased[0].forks}`, issu: `${jsonprased[0].open_issues_count}`, date: `${jsonprased[0].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}, { name: `${jsonprased[1].name}`, lang: `${jsonprased[1].language}`, desc: `${jsonprased[1].description}`, star: `${jsonprased[1].stargazers_count}`, watch: `${jsonprased[1].watchers_count}`, fork: `${jsonprased[1].forks}`, issu: `${jsonprased[1].open_issues_count}`, date: `${jsonprased[1].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}, { name: `${jsonprased[2].name}`, lang: `${jsonprased[2].language}`, desc: `${jsonprased[2].description}`, star: `${jsonprased[2].stargazers_count}`, watch: `${jsonprased[2].watchers_count}`, fork: `${jsonprased[2].forks}`, issu: `${jsonprased[2].open_issues_count}`, date: `${jsonprased[2].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}]
          }
          if(jsonprased[3])
          {
            var val = [{ name: `${jsonprased[0].name}`, lang: `${jsonprased[0].language}`, desc: `${jsonprased[0].description}`, star: `${jsonprased[0].stargazers_count}`, watch: `${jsonprased[0].watchers_count}`, fork: `${jsonprased[0].forks}`, issu: `${jsonprased[0].open_issues_count}`, date: `${jsonprased[0].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}, { name: `${jsonprased[1].name}`, lang: `${jsonprased[1].language}`, desc: `${jsonprased[1].description}`, star: `${jsonprased[1].stargazers_count}`, watch: `${jsonprased[1].watchers_count}`, fork: `${jsonprased[1].forks}`, issu: `${jsonprased[1].open_issues_count}`, date: `${jsonprased[1].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}, { name: `${jsonprased[2].name}`, lang: `${jsonprased[2].language}`, desc: `${jsonprased[2].description}`, star: `${jsonprased[2].stargazers_count}`, watch: `${jsonprased[2].watchers_count}`, fork: `${jsonprased[2].forks}`, issu: `${jsonprased[2].open_issues_count}`, date: `${jsonprased[2].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}, { name: `${jsonprased[3].name}`, lang: `${jsonprased[3].language}`, desc: `${jsonprased[3].description}`, star: `${jsonprased[3].stargazers_count}`, watch: `${jsonprased[3].watchers_count}`, fork: `${jsonprased[3].forks}`, issu: `${jsonprased[3].open_issues_count}`, date: `${jsonprased[3].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}]
          }
          if(jsonprased[4])
          {
            var val = [{ name: `${jsonprased[0].name}`, lang: `${jsonprased[0].language}`, desc: `${jsonprased[0].description}`, star: `${jsonprased[0].stargazers_count}`, watch: `${jsonprased[0].watchers_count}`, fork: `${jsonprased[0].forks}`, issu: `${jsonprased[0].open_issues_count}`, date: `${jsonprased[0].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}, { name: `${jsonprased[1].name}`, lang: `${jsonprased[1].language}`, desc: `${jsonprased[1].description}`, star: `${jsonprased[1].stargazers_count}`, watch: `${jsonprased[1].watchers_count}`, fork: `${jsonprased[1].forks}`, issu: `${jsonprased[1].open_issues_count}`, date: `${jsonprased[1].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}, { name: `${jsonprased[2].name}`, lang: `${jsonprased[2].language}`, desc: `${jsonprased[2].description}`, star: `${jsonprased[2].stargazers_count}`, watch: `${jsonprased[2].watchers_count}`, fork: `${jsonprased[2].forks}`, issu: `${jsonprased[2].open_issues_count}`, date: `${jsonprased[2].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}, { name: `${jsonprased[3].name}`, lang: `${jsonprased[3].language}`, desc: `${jsonprased[3].description}`, star: `${jsonprased[3].stargazers_count}`, watch: `${jsonprased[3].watchers_count}`, fork: `${jsonprased[3].forks}`, issu: `${jsonprased[3].open_issues_count}`, date: `${jsonprased[3].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}, { name: `${jsonprased[4].name}`, lang: `${jsonprased[4].language}`, desc: `${jsonprased[4].description}`, star: `${jsonprased[4].stargazers_count}`, watch: `${jsonprased[4].watchers_count}`, fork: `${jsonprased[4].forks}`, issu: `${jsonprased[4].open_issues_count}`, date: `${jsonprased[4].created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]}]
          }
          else
          {
            const usernp = new discord.MessageEmbed()
            .setColor('#b434eb')
            .addField(`Cannot find any Repositories by ${args[0]}`, `Please try again, or search another user.`)
            .setFooter("GitHub Stats BOT Made by PapaSnags#1555", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
            message.channel.send({embed: usernp })
          }
          const FieldsEmbed = new Pagination.FieldsEmbed()
            .setArray(val)
            .setAuthorizedUsers([message.author.id])
            .setChannel(message.channel)
            .setElementsPerPage(1)
            // Initial page on deploy
            .setPage(1)
            .setPageIndicator(true)
            .formatField('Name', i => i.name)
            .formatField('Language', i => i.lang)
            .formatField('Description', i => i.desc, false)
            .formatField('Stars', i => i.star, true)
            .formatField('Watchers', i => i.watch, true)
            .formatField('Forks', i => i.fork, true)
            .formatField('Issues', i => i.issu, true)
            .formatField('Created', i => i.date, false)

            // Deletes the embed upon awaiting timeout
            .setDeleteOnTimeout(true)
            // Disable built-in navigation emojis, in this case: 🗑 (Delete Embed)
            .setDisabledNavigationEmojis(['delete','jump'])
            // Set your own customised emojis
            .setEmojisFunctionAfterNavigation(false);
          
          FieldsEmbed.embed
            .setColor(0xFF00AE)
            .setTitle(`User Repo Info - @${args[0]}`)
            .setURL(`https://github.com/${args[0]}?tab=repositories`)
            .setThumbnail(jsonprased[0].owner.avatar_url)
            .setFooter("GitHub Stats BOT Made by PapaSnags#1555", "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
            .setDescription(`Repositories by ${args[0]} (Sorted by created date. Max 5)`);
            
          await FieldsEmbed.build();
          message.channel.send("An Embed has been deleted due to inactivity")
          
          }
        send()
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
