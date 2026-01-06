const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'ساكورا',
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: false,
    description: 'Chat with Simsimi',
    category: 'ai',
    guide: {
      en: '{pn} <your message>\nExample: bot Hello'
    }
  },

  onStart: async ({ event, args, api }) => {
    const input = args.join(' ').trim();
    if (!input) {
      return api.sendMessage('Please provide a message.', event.threadID, event.messageID);
    }
//=====================================
// make sure you have set your language in config.json
// ==================================== 
    const configPath = path.resolve(__dirname, '../../config/config.json');
    let language = 'en'; // Default language
    try {
      if (fs.existsSync(configPath)) {
        const config = await fs.readJSON(configPath);
        if (config.language) {
          language = config.language;
        }
      }
    } catch (err) {
      console.error('[sus] Error reading config file:', err.message);
    }

    const apiUrl = `https://simsim-nexalo.vercel.app/api/chat/${encodeURIComponent(input)}/${language}`;
    console.log('Request URL:', apiUrl);

    try {
      const response = await axios.get(apiUrl);
      console.log('API Response:', response.data);
      if (response.data.status === 'success') {
        api.sendMessage(response.data.data.answer, event.threadID, event.messageID);
      } else {
        api.sendMessage("i dont have answer for this pls train me", event.threadID, event.messageID);
      }
    } catch (error) {
      console.error('[sus] Error:', error.message);
      let errorDetails = error.message;
      if (error.response && error.response.data && error.response.data.message) {
          errorDetails = error.response.data.message;
      }
      api.sendMessage(`An error occurred: ${errorDetails}`, event.threadID, event.messageID);
      api.sendMessage("i dont have answer for this pls train me", event.threadID, event.messageID);
    }
  }
};
