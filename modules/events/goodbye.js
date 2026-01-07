const { log } = require('../../logger/logger');
const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'goodbye',
    version: '1.0',
    author: 'Hridoy',
    eventType: ['log:unsubscribe']
  },
  onStart: async ({ event, api }) => {
    try {
      const { logMessageData, threadID } = event;
      const ownUserID = api.getCurrentUserID();

      // لو البوت هو اللي طلع، ما ترسل رسالة
      if (logMessageData.leftParticipantFbId === ownUserID) {
        return;
      }

      const thread = await api.getThreadInfo(threadID);
      const leftUserID = logMessageData.leftParticipantFbId;
      const userInfo = await api.getUserInfo(leftUserID);
      const userName = userInfo[leftUserID] ? userInfo[leftUserID].name : 'شخص ما';

      // رابط صورة المستخدم (بدون توكن — أكثر أمانًا)
      const userImageUrl = `https://graph.facebook.com/${leftUserID}/picture?width=512&height=512`;

      // نص الوداع بالعربي
      const goodbyeText = `${userName} غادر مجموعة ${thread.threadName}!`;

      const apiUrl = `https://nexalo-api.vercel.app/api/goodbye-card?image=${encodeURIComponent(userImageUrl)}&username=${encodeURIComponent(userName)}&text=${encodeURIComponent(goodbyeText)}`;
      console.log(`[طلب API] الإرسال إلى: ${apiUrl}`);

      axios.interceptors.request.use(request => {
        console.log('[تفاصيل طلب API]', {
          url: request.url,
          method: request.method,
          headers: request.headers,
          params: request.params
        });
        return request;
      }, error => {
        console.log('[خطأ في طلب API]', error);
        return Promise.reject(error);
      });

      const apiResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      console.log(`[استجابة API] الحالة: ${apiResponse.status}, النص: ${apiResponse.statusText}`);

      const cacheDir = __dirname + '/cache';
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir);
      }
      const imagePath = `${cacheDir}/goodbye_card.png`;
      fs.writeFileSync(imagePath, Buffer.from(apiResponse.data, 'binary'));

      await api.sendMessage({
        body: 'وداعًا! 👋',
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => fs.unlinkSync(imagePath));

      log('info', `تم إرسال رسالة وداع في المجموعة ${threadID} للمستخدم ${userName}`);
    } catch (error) {
      console.log('[خطأ API]', error.message);
      log('error', `خطأ في حدث الوداع: ${error.message}`);
    }
  },
};
