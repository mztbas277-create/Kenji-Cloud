const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const configs = require("../config.json");
const log = require('../logger');
const { getUser, getAllUsers } = require('../data/user');

/* ===============================
   إعدادات شخصية البوت
================================ */
const BOT_NAME = 'ساكورا';
const BOT_CALL_REGEX = new RegExp(`^${BOT_NAME}(\\s+|،|$)`, 'i');

/* ===============================
   مفاتيح Gemini
================================ */
const API_KEYS = configs.ai_keys || [];
let currentKeyIndex = 0;

/* ===============================
   ذاكرة المحادثات
================================ */
const conversationMemory = {};

/* ===============================
   تعريب الأوامر
================================ */
const commandTranslations = {
  "help": "قائمة",
  "commands": "قائمة",
  "list": "قائمة",
  "create": "اصنعي امر مثل",
  "make": "اصنعي امر مثل",
  "new": "اصنعي امر مثل",
  "edit": "عدلي امر مثل",
  "update": "عدلي امر مثل",
  "delete": "احذف امر",
  "remove": "احذف امر"
};

function translateCommand(text) {
  let result = text;
  for (const key in commandTranslations) {
    const reg = new RegExp(`^${key}`, "i");
    if (reg.test(result)) {
      result = result.replace(reg, commandTranslations[key]);
      break;
    }
  }
  return result;
}

/* ===============================
   جلب بيانات المستخدم
================================ */
async function getUserFullData(userID) {
  try {
    const userData = await getUser(userID);
    if (userData) {
      const displayName = userData.character?.name || userID;
      return { displayName, userData };
    }
    return { displayName: userID, userData: null };
  } catch {
    return { displayName: userID, userData: null };
  }
}

async function getAllUser() {
  const users = await getAllUsers();
  return users || {};
}

/* ===============================
   تعليمات النظام
================================ */
const SYSTEM_INSTRUCTION_TEMPLATE = (commandsJson, userDataJson, allusers) => `
أنتِ فتاة اسمك "ساكورا".
تردين دائمًا بالعربية فقط.
أسلوبك مختصر وواضح.

مهم جدًا:
عند طلب إنشاء أو تعديل أمر:
- أرجعي الكود فقط.
- بدون شرح.
- بدون نص إضافي.

بيانات الأوامر:
${commandsJson}

بيانات المستخدم:
${userDataJson}

كل المستخدمين:
${allusers}
`;

/* ===============================
   التصدير
================================ */
module.exports = {
  config: {
    name: 'ساكورا',
    version: '7.1',
    author: 'Fixed Version',
    countDown: 5,
    prefix: false,
    description: 'AI girl assistant (Arabic) powered by Gemini',
    category: 'ai'
  },

  onStart: async ({ event, args, api, commands }) => {
    try {
      const threadID = event.threadID;
      const senderID = event.senderID;

      let input = args.join(' ').trim();
      if (!input) return;

      if (!BOT_CALL_REGEX.test(input)) return;
      input = input.replace(BOT_CALL_REGEX, '').trim();
      if (!input) return;

      input = translateCommand(input);

      /* ===============================
         أمر القائمة
      ================================ */
      if (input === 'قائمة') {
        return api.sendMessage(
`🌟 أوامر ساكورا
- ساكورا <رسالة>
- ساكورا اصنعي امر مثل <وصف>
- ساكورا عدلي امر مثل <ملف>
- ساكورا احذف امر <ملف>`,
          threadID
        );
      }

      /* ===============================
         إعداد Gemini
      ================================ */
      const { displayName, userData } = await getUserFullData(senderID);
      const allUsers = await getAllUser();

      const SYSTEM_TEXT = SYSTEM_INSTRUCTION_TEMPLATE(
        JSON.stringify(commands || {}, null, 2),
        JSON.stringify(userData || {}, null, 2),
        JSON.stringify(allUsers || {}, null, 2)
      );

      if (!conversationMemory[threadID])
        conversationMemory[threadID] = [];

      const formattedUserQuery = `${displayName}: ${input}`;

      const aiProcess = async (text) => {
        let attempts = 0;

        while (attempts < API_KEYS.length) {
          const keyIndex = (currentKeyIndex + attempts) % API_KEYS.length;
          const key = API_KEYS[keyIndex];

          try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({
              model: "gemini-2.5-flash",
              systemInstruction: SYSTEM_TEXT
            });

            const chat = model.startChat({
              history: conversationMemory[threadID],
              generationConfig: { temperature: 0.2 }
            });

            const result = await chat.sendMessage(text);
            currentKeyIndex = (keyIndex + 1) % API_KEYS.length;

            return result.response.text().trim();
          } catch (e) {
            log.warn(`Gemini key failed: ${e.message}`);
            attempts++;
          }
        }

        return null;
      };

      /* ===============================
         مسار الأوامر الصحيح
      ================================ */
      const commandsDir = path.resolve(__dirname, './'); 
      // لأن الملف نفسه داخل modules/commands

      /* ===============================
         تعديل أمر
      ================================ */
      if (input.startsWith('عدلي امر مثل')) {
        const fileName = input.replace('عدلي امر مثل', '').trim();
        const filePath = path.join(commandsDir, fileName);

        if (!fs.existsSync(filePath))
          return api.sendMessage(`الملف ${fileName} غير موجود!`, threadID);

        const code = await fs.readFile(filePath, 'utf-8');
        const newCode = await aiProcess(
`عدلي الكود التالي.
أرجعي كود JavaScript فقط يبدأ بـ module.exports
${code}`
        );

        if (!newCode || !newCode.includes('module.exports'))
          return api.sendMessage('فشل تعديل الأمر 😥', threadID);

        await fs.writeFile(filePath, newCode, 'utf-8');
        return api.sendMessage(`تم تعديل الأمر: ${fileName} ✅`, threadID);
      }

      /* ===============================
         إنشاء أمر
      ================================ */
      if (input.startsWith('اصنعي امر مثل')) {
        const desc = input.replace('اصنعي امر مثل', '').trim();

        const newCode = await aiProcess(
`أنشئي أمر لبوت فيسبوك ماسنجر.
أرجعي الكود فقط بدون شرح.
يجب أن يحتوي على module.exports.
الوصف:
${desc}`
        );

        if (!newCode || !newCode.includes('module.exports'))
          return api.sendMessage('فشل إنشاء الأمر 😥', threadID);

        const safeName =
          desc.split(' ')[0].replace(/[^a-zA-Z0-9_-]/g, '') || 'newCommand';

        const newFilePath = path.join(commandsDir, `${safeName}.js`);
        await fs.writeFile(newFilePath, newCode, 'utf-8');

        return api.sendMessage(`تم إنشاء الأمر: ${safeName}.js 🎉`, threadID);
      }

      /* ===============================
         حذف أمر
      ================================ */
      if (input.startsWith('احذف امر')) {
        const fileName = input.replace('احذف امر', '').trim();
        const filePath = path.join(commandsDir, fileName);

        if (!fs.existsSync(filePath))
          return api.sendMessage(`الملف ${fileName} غير موجود!`, threadID);

        await fs.remove(filePath);
        return api.sendMessage(`تم حذف الأمر: ${fileName} 🗑️`, threadID);
      }

      /* ===============================
         رد عادي
      ================================ */
      const aiReply = await aiProcess(formattedUserQuery);

      if (!aiReply)
        return api.sendMessage('حصل خطأ تقني 😥', threadID);

      conversationMemory[threadID].push(
        { role: "user", parts: [{ text: formattedUserQuery }] },
        { role: "model", parts: [{ text: aiReply }] }
      );

      if (conversationMemory[threadID].length > 40)
        conversationMemory[threadID] = conversationMemory[threadID].slice(-20);

      return api.sendMessage(aiReply, threadID);

    } catch (err) {
      log.error("Sakura Handler Error: " + err.message);
    }
  }
};
