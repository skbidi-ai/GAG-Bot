const { Client, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, GatewayIntentBits, Partials, time, PermissionsBitField, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

const client = new Client({
  intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction,
        Partials.ThreadMember
    ]
});

  // Host the bot:
  require('http')
    .createServer((req, res) => res.end(''))
    .listen(3030);

  client.once('ready', () => {
    console.log(client.user.username + ' is ready!');
    console.log('== The logs are starting from here ==');
  });

const config = require("./config.js");
const CoinManager = require("./coins.js");
const owner = config.modmail.ownerID
const supportcat = config.modmail.supportId
const premiumcat = config.modmail.premiumId
const whitelistrole = config.modmail.whitelist
const staffID = config.modmail.staff
const log = config.logs.logschannel;
const cooldowns = new Map(); // Map to track cooldowns
const coinManager = new CoinManager();

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Coin commands
  if (message.content.toLowerCase().startsWith("!points")) {
    const args = message.content.split(" ");
    const command = args[1];

    // Check balance
    if (!command || command === "balance") {
      const userId = message.mentions.users.first()?.id || message.author.id;
      const balance = coinManager.getBalance(userId);
      const user = message.mentions.users.first() || message.author;
      
      const balanceEmbed = new EmbedBuilder()
        .setTitle("Points Balance")
        .setDescription(`${user.displayName} has **${balance}** Refferal Points`)
        .setColor("#00FF46")
        .setThumbnail(user.displayAvatarURL());
      
      return message.channel.send({ embeds: [balanceEmbed] });
    }

    // Admin commands - check if user has admin permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && message.author.id !== owner) {
      return message.channel.send("❌ You need administrator permissions to use this command.");
    }

    // Give coins
    if (command === "give") {
      const user = message.mentions.users.first();
      const amount = parseInt(args[3]);
      
      if (!user || isNaN(amount) || amount <= 0) {
        return message.channel.send("❌ Usage: `!coins give @user amount`");
      }

      const newBalance = coinManager.addCoins(user.id, amount);
      
      const giveEmbed = new EmbedBuilder()
        .setTitle("💰 Points Given")
        .setDescription(`Given **${amount}** Points to ${user.displayName}\nNew balance: **${newBalance}** Points`)
        .setColor("#F9B0FF")
        .setThumbnail(user.displayAvatarURL());
      
      message.channel.send({ embeds: [giveEmbed] });
    }

    // Remove coins
    else if (command === "remove") {
      const user = message.mentions.users.first();
      const amount = parseInt(args[3]);
      
      if (!user || isNaN(amount) || amount <= 0) {
        return message.channel.send("❌ Usage: `!coins remove @user amount`");
      }

      const newBalance = coinManager.removeCoins(user.id, amount);
      
      const removeEmbed = new EmbedBuilder()
        .setTitle("💰 Coins Removed")
        .setDescription(`Removed **${amount}** Points from ${user.displayName}\nNew balance: **${newBalance}** Points`)
        .setColor("#F9B0FF")
        .setThumbnail(user.displayAvatarURL());
      
      message.channel.send({ embeds: [removeEmbed] });
    }

    // Set coins
    else if (command === "set") {
      const user = message.mentions.users.first();
      const amount = parseInt(args[3]);
      
      if (!user || isNaN(amount) || amount < 0) {
        return message.channel.send("❌ Usage: `!coins set @user amount`");
      }

      const newBalance = coinManager.setCoins(user.id, amount);
      
      const setEmbed = new EmbedBuilder()
        .setTitle("💰 Coins Set")
        .setDescription(`Set ${user.displayName}'s coins to **${newBalance}**`)
        .setColor("#F9B0FF")
        .setThumbnail(user.displayAvatarURL());
      
      message.channel.send({ embeds: [setEmbed] });
    }

    // Leaderboard
    else if (command === "leaderboard" || command === "lb") {
      const leaderboard = coinManager.getLeaderboard(10);
      
      if (leaderboard.length === 0) {
        return message.channel.send("📊 No users have coins yet!");
      }

      let description = "";
      for (let i = 0; i < leaderboard.length; i++) {
        const [userId, coins] = leaderboard[i];
        const user = client.users.cache.get(userId);
        const username = user ? user.displayName : "Unknown User";
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        description += `${medal} **${username}** - ${coins} coins\n`;
      }

      const leaderboardEmbed = new EmbedBuilder()
        .setTitle("🏆 Coin Leaderboard")
        .setDescription(description)
        .setColor("#F9B0FF")
        .setFooter({ text: `${message.guild.name} | Top 10 Users` });
      
      message.channel.send({ embeds: [leaderboardEmbed] });
    }

    // Help command
    else if (command === "help") {
      const helpEmbed = new EmbedBuilder()
        .setTitle("💰 Coin System Help")
        .setDescription(`
**User Commands:**
\`!coins\` or \`!coins balance\` - Check your coin balance
\`!coins balance @user\` - Check another user's balance
\`!coins leaderboard\` - View the top 10 users

**Admin Commands:**
\`!coins give @user amount\` - Give coins to a user
\`!coins remove @user amount\` - Remove coins from a user
\`!coins set @user amount\` - Set a user's coin balance
        `)
        .setColor("#0099FF")
        .setFooter({ text: "Admin commands require Administrator permissions" });
      
      message.channel.send({ embeds: [helpEmbed] });
    }
  }

  if (message.author.id === owner) {
    if (message.content.toLowerCase().startsWith("!ticket-embed")) {
      message.delete();
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel("📨 Inquiry Tickets")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("support"),
          new ButtonBuilder()
            .setLabel("💸 Buying Tickets")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("premium")
        );

      const ticketmsg = new EmbedBuilder()
        .setTitle(`Tasty's Tickets`)
        
        .setDescription(
          
          `**Welcome to tasty's tickets!** 🎫
         ==========================
📨 **Inquiry Tickets:** Ask about pet prices and get assistance.

💸 **Buying Tickets:** Buy from tasty.
`
        )
        .setFooter({ text: `${message.guild.name} Tickets | Made by Game Services`, iconURL: message.guild.iconURL() })
        .setColor("#F9B0FF");

      message.channel.send({
        embeds: [ticketmsg],
        components: [row],
      });
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      const userId = interaction.user.id;
      const userCooldown = cooldowns.get(userId) || 0;
      const currentTime = Date.now();

      if (userCooldown > currentTime && (interaction.customId === "support" || interaction.customId === "premium")) {
        const remainingTime = Math.ceil((userCooldown - currentTime) / 1000);
        interaction.reply({
          content: `You're on a cooldown. Please wait ${remainingTime} seconds before opening another ticket.`,
          ephemeral: true,
        });
        return;
      }

      if (interaction.customId === "support" || interaction.customId === "premium") {
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("⚙️ Manage")
            .setCustomId("close")
            .setStyle(ButtonStyle.Primary)
        );

        const supportmsg = new EmbedBuilder()
          .setTitle(`${interaction.user.displayName}'s Support Ticket`)
          .setDescription(
            "**Hello!**\nPlease provide the reason for this support ticket, and our staff team will respond as fast as possible"
          )
          .setFooter({ text: `User ID: ${interaction.user.id} Grow A Garden┃Trading & Stocks.` })
          .setColor("#00ff04");

        const premiummsg = new EmbedBuilder()
          .setTitle(`${interaction.user.displayName}'s Buying Ticket`)
          .setDescription(
            "**Hello there!**\nPlease provide the reason for this buying ticket, and our staff team will respond as fast as possible"
          )
          .setFooter({ text: `User ID: ${interaction.user.id} Game Services Premuim.` })
          .setColor("#ffc916");

        if (interaction.customId === "support") {
          const ticket = await interaction.guild.channels.create({
            name: `ticket ${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: supportcat,
            permissionOverwrites: [
              {
                id: interaction.user.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                ],
              },
              {
                id: whitelistrole,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                ],
              },
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
            ],
          });

          interaction.reply({
            content: `<#${ticket.id}> has been made for you under Premuim General Support Category.`,
            ephemeral: true,
          });

client.channels.cache.get(log).send(`# New Ticket\n\n**User:** <@${interaction.user.id}> opened <#${ticket.id}> under General Support Category!`);
          ticket.send({
            content: `<@&${staffID}>\n**==========================**`,
            embeds: [supportmsg],
            components: [row2],
          });

          // Set cooldown for the user (2 hours in milliseconds)
          cooldowns.set(userId, currentTime + 2 * 60 * 60 * 1000);
        }

        if (interaction.customId === "premium") {
          const ticket = await interaction.guild.channels.create({
            name: `ticket ${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: premiumcat,
            permissionOverwrites: [
              {
                id: interaction.user.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                ],
              },
              {
                id: whitelistrole,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                ],
              },
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
            ],
            });

          interaction.reply({
            content: `<#${ticket.id}> has been made for you under Premium Middleman Services Category.`,
            ephemeral: true,
          });

client.channels.cache.get(log).send(`# New Ticket\n\n**User:** <@${interaction.user.id}> opened <#${ticket.id}> under Buying Support Category!`);
          ticket.send({
            content: `<@&${staffID}>\n**==========================**`,
            embeds: [premiummsg],
            components: [row2],
          });

          // Set cooldown for the user (2 hours in milliseconds)
          cooldowns.set(userId, currentTime + 2 * 60 * 60 * 1000);
        }
      } else if (interaction.customId === "close") {
        // Check if the user has the whitelisted role
        const guild = interaction.guild;
        const member = guild.members.cache.get(userId);

        if (!member.roles.cache.has(whitelistrole)) {
          // User is not whitelisted, send an ephemeral message
          interaction.reply({
            content: "You are not whitelisted to perform this action, You need helper role.",
            ephemeral: true,
          });
          return;
        }

        const deleteButton = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel("🗑️ Delete")
              .setCustomId("delete")
              .setStyle(ButtonStyle.Danger)
          );

        const close2Button = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel("🔒 Close")
              .setCustomId("close2")
              .setStyle(ButtonStyle.Primary)
          );

        interaction.update({ content: `<@${interaction.user.id}> **Please click on either of the following button.**`, components: [deleteButton, close2Button] });
      } else if (interaction.customId === "delete") {
        // Delete the channel
        const channel = interaction.channel;
        channel.delete()
          .then(() => {
            interaction.reply("Ticket channel deleted.");
            client.channels.cache.get(log).send(`# Ticket Deleted\n\n**User:** <@${interaction.user.id}> deleted a ticket.`);
          })
          .catch(console.error);
      } else if (interaction.customId === "close2") {
        interaction.channel.permissionOverwrites.set([
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
          }
        ]);
        interaction.reply(`<@${interaction.user.id}> closed the ticket.`);
  client.channels.cache.get(log).send(`# Ticket Closed\n\n**User:** <@${interaction.user.id}> closed a ticket.`);
      }
    }
  } catch (e) {
    console.log(e);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  if (message.content.toLowerCase() === `!setup`) {
    // Create General Tickets category
    const generalTicketsCategory = await message.guild.channels.create({
      name: 'General Tickets',
      type: ChannelType.GuildCategory,
    });

    // Create Premium Tickets category
    const premiumTicketsCategory = await message.guild.channels.create({
      name: 'Premium Tickets',
      type: ChannelType.GuildCategory,
    });

    // Create Ticket Logs category
    const ticketLogsCategory = await message.guild.channels.create({
      name: 'Logs', 
      type: ChannelType.GuildCategory,
    });

    // Create a channel inside Ticket Logs category named 'ticket-logs'
    const ticket = await message.guild.channels.create({
      name: `ticket logs`,
      type: ChannelType.GuildText,
      parent: ticketLogsCategory,
      permissionOverwrites: [
        {
          id: message.author.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
          ],
        },
        {
          id: whitelistrole,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
          ],
        },
        {
          id: message.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
      });

    // Reply to the user in the channel where the command was received
    message.channel.send('Ticket setup completed!');
  }
});

client.login(process.env.TOKEN);
