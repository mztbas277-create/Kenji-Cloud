module.exports = {
  config: {
    name: 'ضيف',
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true,
    description: 'Adds a user to the group.',
    category: 'group',
    guide: {
      en: '   {pn} [uid|@mention]'
    },
  },
  onStart: async ({ api, event, args }) => {
    try {
      let targetID;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (args.length > 0) {
        targetID = args[0];
      } else {
        return api.sendMessage('Please provide a UID or mention a user to add.', event.threadID);
      }

      if (!targetID) {
        return api.sendMessage('Invalid user to add.', event.threadID);
      }

      api.addUserToGroup(targetID, event.threadID, (err) => {
        if (err) {
          console.error("Failed to add user:", err);
          return api.sendMessage('Failed to add user. Make sure the user is a friend of the bot or the bot has permission.', event.threadID);
        }
        api.sendMessage(`Successfully added user ${targetID} to the group.`, event.threadID);
      });

    } catch (error) {
      console.error("Error in add command:", error);
      api.sendMessage('An error occurred while trying to add the user.', event.threadID);
    }
  },
};
