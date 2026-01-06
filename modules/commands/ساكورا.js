const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'ساكورا',
    version: '2.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: false,
    description: 'AI assistant for dev: translate, fix, or create bot commands',
    category: 'ai',
    guide: {
      en: '{pn} <message>\nExample: ساكورا Hello\nAdvanced: ساكورا عدلي امر مثل uptime.js'
    },
    developerOnly: true // ⚠️ هذا الامر خاص بالمطور فقط
  },

  onStart: async ({ event, args, api, Users }) => {
    const input = args.join(' ').trim();
    if (!input) return api.sendMessage('Please provide a message.', event.threadID, event.messageID);

    // تحميل اللغة من config
    const configPath = path.resolve(__dirname, '../../config/config.json');
    let language = 'en';
    try {
      if (fs.existsSync(configPath)) {
        const config = await fs.readJSON(configPath);
        if (config.language) language = config.language;
      }
    } catch (err) {
      console.error('[Sakura] Error reading config file:', err.message);
    }

    // الدالة الذكية للذكاء الصناعي
    async function aiProcess(command) {
      const apiUrl = `https://simsim-nexalo.vercel.app/api/chat/${encodeURIComponent(command)}/${language}`;
      try {
        const response = await axios.get(apiUrl);
        if (response.data.status === 'success') return response.data.data.answer;
        return "لا أملك جواب لهذا، يمكنك تدريبي!";
      } catch (error) {
        console.error('[Sakura AI] Error:', error.message);
        return "حدث خطأ أثناء معالجة الأمر. حاول مرة أخرى!";
      }
    }

    // ======================================
    // Special developer commands
    // Usage: "ساكورا عدلي امر مثل <filename>" OR "ساكورا اصنعي امر مثل <command description>"
    // ======================================
    if (input.startsWith('عدلي امر مثل')) {
      const fileName = input.replace('عدلي امر مثل', '').trim();
      const filePath = path.resolve(__dirname, 'commands', fileName);
      if (!fs.existsSync(filePath)) {
        return api.sendMessage(`الملف ${fileName} غير موجود!`, event.threadID, event.messageID);
      }
      // قراءة الكود الحالي
      let code = await fs.readFile(filePath, 'utf-8');
      // اطلب من الذكاء الصناعي تعديل الكود
      const newCode = await aiProcess(`عدل هذا الكود ليعمل بشكل صحيح:\n${code}`);
      await fs.writeFile(filePath, newCode, 'utf-8');
      return api.sendMessage(`تم تعديل الأمر بنجاح: ${fileName}`, event.threadID, event.messageID);
    }

    if (input.startsWith('اصنعي امر مثل')) {
      const commandDesc = input.replace('اصنعي امر مثل', '').trim();
      const newCommandCode = await aiProcess(`اصنع لي كود بوت فيسبوك ماسنجر لأمر يقوم بـ: ${commandDesc}`);
      // نختار اسم للملف تلقائي
      const safeName = commandDesc.split(' ')[0] || 'newCommand';
      const newFilePath = path.resolve(__dirname, 'commands', `${safeName}.js`);
      await fs.writeFile(newFilePath, newCommandCode, 'utf-8');
      return api.sendMessage(`تم إنشاء الأمر الجديد: ${safeName}.js`, event.threadID, event.messageID);
    }

    // أي رسالة عامة تتعامل كدردشة مع الذكاء الصناعي
    const aiReply = await aiProcess(input);
    return api.sendMessage(aiReply, event.threadID, event.messageID);
  }
};
