const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

var request = require("request");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Provides information about the user profile.')
        .addStringOption(option =>
			option
				.setName('user')
				.setDescription('The username you want to lookup.')),

	async execute(interaction) {
		const user = interaction.options.getString('user');

        if(!user){
            await interaction.reply('No username provided.')
            return
        }
        var options = {
            method: 'GET',
            url: `https://api.github.com/users/${user}`,
            headers: {
              'User-Agent': 'GitHub-Stats-LachlanDev',
              useQueryString: true
            }
        };
        request(options, function (error, response, body){
            try{
                jsonprased = JSON.parse(body)
            }
            catch(e){
                console.log('Error')
                return
            }
        

        if(jsonprased.message == "Not Found"){
            interaction.reply(`${user} Not Found!`);
        }
        else{
            const username = jsonprased.login
            const id = jsonprased.id
            const avatar_url = jsonprased.avatar_url
            const html_url = jsonprased.html_url
            const type = jsonprased.type
            const name = jsonprased.name ?? 'Null'
            const company = jsonprased.company ?? 'Null'
            const website = (jsonprased.blog == '' ? 'Null' : `${jsonprased.blog}`)
            const location = jsonprased.location ?? 'Null'
            const bio = jsonprased.bio ?? 'Null'
            const repos = jsonprased.public_repos
            const gists = jsonprased.public_gists
            const followers = jsonprased.followers
            const following = jsonprased.following
            const created_at = jsonprased.created_at
            const updated_at = jsonprased.updated_at

            const Embed = new EmbedBuilder()
                .setColor('#b434eb')
                .setTitle(`GitHub User Info - ${username}`)
                .setURL(html_url)
                .setThumbnail(avatar_url)
                .addFields(
                    {name: 'Username', value: `${username}`, inline: true},
                    {name: 'Name', value: `${name}`, inline: true},
                    {name: 'ID', value: `${id}`, inline: true},
                    {name: 'Type', value: `${type}`, inline: true}

                )
                .addFields(
                    {name: 'Bio', value: `${bio}`},
                    {name: 'Location', value: `${location}`},
                    {name: 'Company', value: `${company}`},
                    {name: 'Website', value: `${website}`}

                )
                .addFields(
                    {name: 'Repos', value: `${repos}`, inline: true},
                    {name: 'Gists', value: `${gists}`, inline: true},
                    {name: 'Followers', value: `${followers}`, inline: true},
                    {name: 'Following', value: `${following}`, inline: true},

                )
                .addFields(
                    {name: 'Updated', value: `${updated_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]},
                    {name: 'Joined', value: `${created_at}`.replace(/T/, ' ').replace(/\..+/, '').split(' ')[0]},

                )
                .setFooter({ text: 'Made by LachlanDev#8014', iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}); 

            interaction.reply({ embeds: [Embed] });
        }
        })
	},
};