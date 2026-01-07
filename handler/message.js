const { handleCommand } = require('./command');
const { Users, Threads } = require('../database/database');
const config = require('../config/config.json');
const { log } = require('../logger/logger');

const handleMessage = async (event, api, commands) => {
  try {
    // السماح بالرسائل أو الردود أو الأحداث (مثل إضافة عضو)
    if (!['message', 'message_reply', 'event'].includes(event.type)) return;

    // جلب معلومات المستخدم والقروب بحذر
    let userInfo = {};
    let threadInfo = {};
    try {
      if (event.senderID) userInfo = await api.getUserInfo(event.senderID);
      if (event.threadID) threadInfo = await api.getThreadInfo(event.threadID);
    } catch (err) {
      log('warn', `تعذر جلب معلومات المستخدم/المجموعة: ${err.message}`);
    }

    const userName = userInfo[event.senderID]?.name || 'مستخدم غير معروف';
    const threadName = threadInfo?.name || 'مجموعة غير معروفة';

    // حفظ المستخدم والقروب في قاعدة البيانات
    if (event.senderID) Users.create(event.senderID, userName);
    if (event.threadID) Threads.create(event.threadID, threadName);

    const userData = event.senderID ? Users.get(event.senderID) : {};
    const threadData = event.threadID ? Threads.get(event.threadID) : {};

    // تحديث بيانات المستخدم
    if (event.senderID) {
      userData.name = userName; 
      userData.messageCount = (userData.messageCount || 0) + 1;
      userData.lastActive = new Date().toISOString();

      // حساب XP وترقية الرتبة
      const xpToGive = Math.floor(Math.random() * 10) + 5;
      userData.xp = (userData.xp || 0) + xpToGive;
      userData.totalxp = (userData.totalxp || 0) + xpToGive;
      const requiredXp = 5 * Math.pow(userData.rank + 1, 2);
      if (userData.xp >= requiredXp) {
        userData.rank++;
        userData.xp -= requiredXp;
      }
      Users.set(event.senderID, userData);
    }

    // تحديث بيانات القروب
    if (event.threadID) {
      threadData.name = threadName; 
      Threads.set(event.threadID, threadData);
    }

    // تجهيز معلومات الرسالة
    const body = event.body || '';
    const isGroup = event.isGroup || false;
    const messageType = event.attachments && event.attachments.length > 0 ? 'وسائط' : 'نص';
    // إذا مافي attachment، نجلب صورة المستخدم مباشرة
    let mediaUrl = 'غير متوفر';
    if (event.attachments && event.attachments.length > 0) {
      mediaUrl = event.attachments[0].url || 'غير متوفر';
    } else if (event.senderID) {
      mediaUrl = `https://graph.facebook.com/${event.senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    }
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const logMessage = `${time} - ${userName} (${isGroup ? 'مجموعة' : 'خاص'}) - النوع: ${messageType} - الرسالة: ${body} - رابط الوسائط: ${mediaUrl}`;
    log('info', logMessage);

    // معالجة الردود على الرسائل
    if (event.messageReply && global.client?.handleReply) {
      const { handleReply } = global.client;
      const reply = handleReply.find(r => r.messageID === event.messageReply.messageID);
      if (reply) {
        const command = global.client.commands.get(reply.name);
        if (command && command.handleReply) {
          await command.handleReply({ event, api, handleReply: reply });
        }
      }
    }

    // البادئة
    const currentPrefix = threadData?.settings?.prefix || config.prefix;
    const commandName = body.split(' ')[0].toLowerCase();
    const commandsList = global.client.commands; 

    // تنفيذ أوامر بدون البادئة
    const noPrefixCommand = commandsList.get(commandName) || Array.from(commandsList.values()).find(cmd => cmd.config.aliases?.includes(commandName));
    if (noPrefixCommand && noPrefixCommand.config.prefix === false) {
      const args = body.trim().split(/\s+/);
      if (args.length === 0) return;
      await handleCommand({ message: body, args, event, api, Users, Threads, commands: commandsList, config: global.client.config });
      return;
    }

    // تنفيذ أوامر بالبادئة
    if (body.startsWith(currentPrefix)) {
      const args = body.slice(currentPrefix.length).trim().split(/\s+/);
      if (args.length === 0) return;
      await handleCommand({ message: body, args, event, api, Users, Threads, commands: commandsList, config: global.client.config });
    }
  } catch (error) {
    log('error', `خطأ في معالجة الرسالة: ${error.message}`);
  }
};

module.exports = { handleMessage };
