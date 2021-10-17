require('module-alias/register')

const path = require('path')
const Commando = require('discord.js-commando')
const config = require('@root/config.json')

const client = new Commando.CommandoClient({
  owner: config.owner,
  commandPrefix: config.prefix,
})

client.on('ready', async () => {
  console.log('The client is ready!')

  client.registry
    .registerGroups([
      ['games', 'game commands']
    ])
    .registerDefaults()
    .registerCommandsIn(path.join(__dirname, 'cmds'))
})

client.login(config.token)
