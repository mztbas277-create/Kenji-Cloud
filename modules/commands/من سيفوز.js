const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'من سيفوز', // تم تغيير اسم الأمر
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'إنشاء ميم "من سيفوز" بين مستخدمين.',
        category: 'fun',
        guide: {
            en: '{pn}من سيفوز @شخص\n{pn}من سيفوز @user1 @user2'
        },
    },

    onStart: async ({ api, event }) => {
        const { senderID, mentions, threadID } = event;
        const mentionIDs = Object.keys(mentions);

        if (mentionIDs.length === 0) {
            return api.sendMessage("❌ الرجاء عمل منشن لمستخدم واحد على الأقل.\nمثال: من سيفوز @شخص", threadID);
        }

        let imageUrl1, imageUrl2;
        let id1, id2;

        if (mentionIDs.length === 1) {
            // إذا ذكر مستخدم واحد، المستخدم الأول هو المرسل
            id1 = senderID;
            id2 = mentionIDs[0];
        } else {
            // إذا ذكر مستخدمين، نستخدمهما
            id1 = mentionIDs[0];
            id2 = mentionIDs[1];
        }

        // روابط صور البروفايل
        imageUrl1 = `https://graph.facebook.com/${id1}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        imageUrl2 = `https://graph.facebook.com/${id2}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

        const apiUrl = `http://sus-apis-2.onrender.com/api/who-would-win?image1=${encodeURIComponent(imageUrl1)}&image2=${encodeURIComponent(imageUrl2)}`;

        try {
            api.sendMessage("⚔️ جاري إنشاء ميم 'من سيفوز'...", threadID);
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }
            const imagePath = path.join(cacheDir, `www_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => fs.unlinkSync(imagePath));
        } catch (error) {
            console.error("خطأ أثناء إنشاء ميم من سيفوز:", error);
            api.sendMessage("❌ لا يمكن إنشاء الميم الآن. حاول لاحقًا.", threadID);
        }
    }
};
