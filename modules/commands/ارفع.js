const { isOwner } = require('../../func/permissions');
const { log } = require('../../logger/logger');
const fs = require('fs-extra'); 

module.exports = {
  config: {
    name: 'ارفع',
    version: 1.1',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    aliases: ['adm'],
    description: 'Manage admin permissions',
    category: 'admin',
    guide: {
      en: '   {pn} [add|remove] [uid|@mention]'
    },
  },
  onStart: async ({ message, args, event, api }) => {
    try {
      if (!isOwner(event.senderID)) {
        return api.sendMessage('Only the bot owner can manage admins.', event.threadID);
      }

      if (args.length < 1) {
        return api.sendMessage('Usage: !admin [add|remove] [uid|@mention]', event.threadID);
      }

      const action = args[0].toLowerCase();
      let targetUID;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetUID = Object.keys(event.mentions)[0]; 
      } else if (args.length > 1) {
        targetUID = args[1];
      } else {
        return api.sendMessage('Please provide a UID or mention a user.', event.threadID);
      }

      if (!['add', 'remove'].includes(action)) {
        return api.sendMessage('Invalid action. Use add or remove.', event.threadID);
      }

 
      const currentConfig = global.client.config;

      if (action === 'add') {
        if (currentConfig.adminUIDs.includes(targetUID)) {
          return api.sendMessage('User is already an admin.', event.threadID);
        }
        currentConfig.adminUIDs.push(targetUID);
        fs.writeJsonSync('./config/config.json', currentConfig, { spaces: 2 });
        api.sendMessage(`User ${targetUID} added as admin.`, event.threadID);
        log('info', `Admin added: ${targetUID}`);
      } else { 
        if (!currentConfig.adminUIDs.includes(targetUID)) {
          return api.sendMessage('User is not an admin.', event.threadID);
        }
        currentConfig.adminUIDs = currentConfig.adminUIDs.filter(id => id !== targetUID);
        fs.writeJsonSync('./config/config.json', currentConfig, { spaces: 2 });
        api.sendMessage(`User ${targetUID} removed from admins.`, event.threadID);
        log('info', `Admin removed: ${targetUID}`);
      }
    } catch (error) {
      log('error', `Admin command error: ${error.message}`);
      api.sendMessage('An error occurred while managing admins.', event.threadID);
    }
  },
};
