const axios = require('axios');

module.exports = {
    config: {
        name: 'سايفر', // اسم الأمر الآن عربي
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'الدردشة مع الذكاء الاصطناعي سايفر.',
        category: 'ai',
        guide: {
            en: '   {pn}سايفر <نص الرسالة>'
        },
    },
    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;

        const prompt = args.join(' ').trim();
        if (!prompt) {
            return api.sendMessage('❌ الرجاء إدخال نص الرسالة. مثال: !سايفر احكي لي قصة', threadID, messageID);
        }

        try {
            console.log(`طلب سايفر مع النص: ${prompt}`);
            const response = await axios.get(
                `https://hridoy-apis.onrender.com/ai/zephyr?text=${encodeURIComponent(prompt)}`,
                { timeout: 15000 }
            );

            console.log('استجابة سايفر:', response.data);

            if (response.data.status && response.data.result) {
                api.sendMessage(response.data.result, threadID, messageID);
            } else {
                throw new Error('استجابة غير صالحة من API سايفر');
            }
        } catch (error) {
            console.error('خطأ سايفر:', error.message);
            api.sendMessage(`❌ خطأ: ${error.message}`, threadID, messageID);
        }
    },
};
