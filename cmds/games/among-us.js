const Discord = require('discord.js')
const Commando = require('discord.js-commando')
const path = require('path')
const config = require('@root/config.json')

// Global Variables To Remember
var msgMainDisplay = null;
var roomCode = "";
var roomState = "";
var voiceConnection = null;
var voiceChannel = null;
var songchoice = 0;
var shantysongchoice = 0;
var musicEventListener = false;
var shantyMusicEventListener = false;
var closeEventListener = false;
var finishEventListener = false;
var discussionEventListener = false;

///
/// Ensures that there is a default message to update.
/// It also removes the message command
///
const checkMainDisplay = async (message) => {
  if (msgMainDisplay != null) {
    await msgMainDisplay.channel.messages.fetch(msgMainDisplay.id).then(msg => {
      msgMainDisplay = msg;
    });
  }
  else {
    await message.channel.send('(this message will update automatically.)').then((msg) => {
      msgMainDisplay = msg;
    });
  }
  msgMainDisplay.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
  if (message != null) {
    message.delete();
  }
}



///
/// Close The Bot
///
const closeAction = async () => {
  roomCode = null;
  roomState = null;
  msgMainDisplay.guild.members.cache.forEach((member) => {
    if (member.user.bot == false && member.voice.serverMute != false) {
      member.voice.setMute(false);
    }
  });
  if (msgMainDisplay != null) {
    msgMainDisplay.delete();
  }
  if (voiceChannel != null) {
    voiceChannel.leave();
  }
  msgMainDisplay = null;
  voiceConnection = null;
}
const closeListenerAction = async () => {
  if (closeEventListener == false) {
    msgMainDisplay.awaitReactions((reaction, user) => user.bot == false && reaction.emoji.name == '❌', { max: 1 }).then(collected => {
      closeEventListener = false;
      if (roomCode != null) {
        closeAction();
      }
    });
    closeEventListener = true;
  }
}



///
/// The Output for the Lobby
///
const lobbyAction = async () => {
  // Set defaults
  await checkMainDisplay();
  roomState = "LOBBY";
  const embed = new Discord.MessageEmbed()
    .setTitle('Among Us Dashboard')
    .addFields(
      {
        name: 'Game Status: Waiting For Players',
        value: 'Currently in the lobby, waiting for people to join the fun!',
      },
      {
        name: 'Room Code: ' + roomCode,
        value: 'To join click "Online --> Private Game --> ' + roomCode + '"'
      },
      {
        name: 'Click the reactions below:',
        value: '▶️ will indicate the game is starting.\n❌ closes the room and dashboard.',
      }
    )
  msgMainDisplay.edit(embed);
  msgMainDisplay.react('▶️')
  msgMainDisplay.react('❌')

  msgMainDisplay.guild.members.cache.forEach((member) => {
    if (member.user.bot == false && member.voice.serverMute != false) {
      member.voice.setMute(false);
    }
  });

  msgMainDisplay.awaitReactions((reaction, user) => user.bot == false && reaction.emoji.name == '▶️', { max: 1 }).then(collected => {
    if (roomCode != null) {
      startAction();
    }
  });
  closeListenerAction();
};



///
/// Start the game
///
const startAction = async () => {
  await voiceConnection.play(path.join(__dirname, '../../sounds/start-game.mp3'));
  setTimeout(tasksAction, 5000);
};



///
/// Finish the game
///
const finishAction = async () => {
  await voiceConnection.play(path.join(__dirname, '../../sounds/victory.mp3'));
  await lobbyAction();
};
const finishListenerAction = async () => {
  if (finishEventListener == false) {
    msgMainDisplay.awaitReactions((reaction, user) => user.bot == false && reaction.emoji.name == '⏹️', { max: 1 }).then(collected => {
      finishEventListener = false;
      if (roomCode != null) {
        finishAction();
      }
    });
    finishEventListener = true;
  }
}



///
/// Music Action
///
const musicAction = async (doCycle) => {
  if (doCycle) {
    songchoice++;
  }
  var songname = null;
  if (songchoice == config.music.length + 1) {
    songchoice = 0;
    songname = "../../sounds/silence.mp3";
  } else {
    config.music.forEach(element => {
      if (element.order == songchoice) {
        songname = element.file;
      }
    });
  }
  if (songname != null) {
    shantysongchoice = 0;
    await voiceConnection.play(path.join(__dirname, songname));
  }
  if (musicEventListener == false) {
    msgMainDisplay.awaitReactions((reaction, user) => user.bot == false && reaction.emoji.name == '🎵', { max: 1 }).then(collected => {
      musicEventListener = false;
      if (roomCode != null) {
        musicAction(true);
      }
    });
    musicEventListener = true;
  }
};



///
/// Sea Shanty Music Action
///
const shantyMusicAction = async (doCycle) => {
  if (doCycle) {
    shantysongchoice++;
  }
  var songname = null;
  if (shantysongchoice == config.shanty.length + 1) {
    shantysongchoice = 0;
    songname = "../../sounds/silence.mp3";
  } else {
    config.shanty.forEach(element => {
      if (element.order == shantysongchoice) {
        songname = element.file;
      }
    });
  }
  if (songname != null) {
    songchoice = 0;
    await voiceConnection.play(path.join(__dirname, songname));
  }
  if (shantyMusicEventListener == false) {
    msgMainDisplay.awaitReactions((reaction, user) => user.bot == false && reaction.emoji.name == '🚢', { max: 1 }).then(collected => {
      shantyMusicEventListener = false;
      if (roomCode != null) {
        shantyMusicAction(true);
      }
    });
    shantyMusicEventListener = true;
  }
};



///
/// The Output for the Tasks
///
const tasksAction = async () => {
  // Set defaults
  await checkMainDisplay();
  roomState = "TASKS";
  const embed = new Discord.MessageEmbed()
    .setTitle('Among Us Dashboard')
    .addFields(
      {
        name: 'Game Status: In Progress',
        value: 'A game is currently in progress. Please wait to join.',
      },
      {
        name: 'Room Code: ' + roomCode,
        value: 'To join click "Online --> Private Game --> ' + roomCode + '"'
      },
      {
        name: 'Click the reactions below:',
        value: '📢 will indicate the game is in discussion mode and unmute everyone.\n⏹️ will stop the game and return to lobby mode.\n🎵 cycle between background music during tasks.\n🚢 cycle between Sea Shanty background music during tasks. (Trending)\n❌ will stop this among us session and room.',
      }
    );

  // Mute All Members on the Among Us Voice Channel by giving them the Role for it.
  msgMainDisplay.guild.members.cache.forEach((member) => {
    if (member.user.bot == false && member.voice.serverMute != true) {
      member.voice.setMute(true);
    }
  });

  // Add Reactions And Events
  msgMainDisplay.edit(embed);
  msgMainDisplay.react('📢')
  msgMainDisplay.react('⏹️')
  msgMainDisplay.react('🎵')
  msgMainDisplay.react('🚢')
  msgMainDisplay.react('❌')
  discussionListenerAction();
  finishListenerAction();
  closeListenerAction();

  // Start Music
  musicAction(false);
  shantyMusicAction(false);
}



///
/// The Output for the Discussion
///
const discussionAction = async () => {
  // Set defaults
  await checkMainDisplay();
  roomState = "DISCUSSION";
  await voiceConnection.play(path.join(__dirname, '../../sounds/emergency-meeting.mp3'));
  const embed = new Discord.MessageEmbed()
    .setTitle('Among Us Dashboard')
    .addFields(
      {
        name: 'Game Status: In Progress',
        value: 'A game is currently in progress. Please wait to join.',
      },
      {
        name: 'Room Code: ' + roomCode,
        value: 'To join click "Online --> Private Game --> insert ' + roomCode + '"'
      },
      {
        name: 'Click the reactions below:',
        value: '▶️ will indicate the game is in discussion mode and unmute everyone.\n⏹️ will stop the game and return to lobby mode.\n❌ will stop this among us session and room.',
      }
    );

  // Mute All Members on the Among Us Voice Channel by giving them the Role for it.
  msgMainDisplay.guild.members.cache.forEach((member) => {
    if (member.user.bot == false && member.voice.serverMute != false) {
      member.voice.setMute(false);
    }
  });

  msgMainDisplay.edit(embed);
  msgMainDisplay.react('▶️')
  msgMainDisplay.react('⏹️')
  msgMainDisplay.react('❌')

  msgMainDisplay.awaitReactions((reaction, user) => user.bot == false && reaction.emoji.name == '▶️', { max: 1 }).then(collected => {
    if (roomCode != null) {
      tasksAction();
    }
  });
  finishListenerAction();
  closeListenerAction();
}
const discussionListenerAction = async () => {
  if (discussionEventListener == false) {
    msgMainDisplay.awaitReactions((reaction, user) => user.bot == false && reaction.emoji.name == '📢', { max: 1 }).then(collected => {
      discussionEventListener = false;
      if (roomCode != null) {
        discussionAction();
      }
    });
    discussionEventListener = true;
  }
}



///
/// Sets The Dashboard to Lobby with Room Code
///
module.exports = class RoomCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: "amongus",
      group: 'games',
      memberName: 'amongus.start',
      description: 'Emmersive experience while playing Among Us',
      argsType: 'multiple',
    })
    client.user.setPresence({
      activity: {
        name: "!amongus ROOMCODE",
        type: "WATCHING",
      },
    })
  }

  async run(message, args) {
    await checkMainDisplay(message);
    const [code] = args

    // Join the Voice Channel
    const { voice } = message.member
    if (!voice.channelID) {
      message.reply('You must be in a voice channel').then(msg => {
        msg.delete({ timeout: 5000 });
      });
      return;
    }
    await voice.channel.join().then((connection) => {
      voiceConnection = connection;
    });
    voiceChannel = voice.channel;

    // Set Room Code
    if (code == undefined || code == null) {
      message.reply('You must set a Room code. Do so by typing "!amongus ROOMCODE" where ROOMCODE is your code.').then(msg => {
        msg.delete({ timeout: 5000 });
      });
      return;
    }
    roomCode = code.toUpperCase();

    // Call The Lobby Action
    await lobbyAction();
  }
}