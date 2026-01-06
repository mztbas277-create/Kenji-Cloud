module.exports = {
  config: {
    name: 'بانكاي',
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true, 
    description: 'Kicks a user from the group.',
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
        return api.sendMessage('Please provide a UID or mention a user to kick.', event.threadID);
      }

      if (!targetID) {
        return api.sendMessage('Invalid user to kick.', event.threadID);
      }

      api.removeUserFromGroup(targetID, event.threadID, (err) => {
        if (err) {
          console.error("Failed to kick user:", err);
          return api.sendMessage('  دايرني اطردو بقوت الصداقه'-'؟ .       ارفع ادمن يا ظنج'-'   .', event.threadID);
        }
        api.sendMessage(`Successfully kicked user ${targetID} from the group.`, event.threadID);
      });

    } catch (error) {
      console.error("Error in kick command:", error);
      api.sendMessage('An error occurred while trying to kick the user.', event.threadID);
    }
  },
};
