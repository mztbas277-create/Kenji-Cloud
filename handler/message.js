const { handleCommand } = require('./command');
const { Users, Threads } = require('../database/database');
const config = require('../config/config.json');
const { log } = require('../logger/logger');

const handleMessage = async (event, api, commands) => {
  try {
    if (event.type !== 'message' && event.type !== 'message_reply' || !event.body) return;

    // جلب معلومات المستخدم والقروب
    const [userInfo, threadInfo] = await Promise.all([
      api.getUserInfo(event.senderID),
      api.getThreadInfo(event.threadID)
    ]);

    const userName = userInfo[event.senderID]?.name || 'مستخدم غير معروف';
    const threadName = threadInfo?.name || 'مجموعة غير معروفة';

    // حفظ المستخدم والقروب في قاعدة البيانات
    Users.create(event.senderID, userName);
    Threads.create(event.threadID, threadName);

    const userData = Users.get(event.senderID);
    const threadData = Threads.get(event.threadID);

    // تحديث بيانات المستخدم
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

    // تحديث بيانات القروب
    threadData.name = threadName; 
    Threads.set(event.threadID, threadData);

    // تجهيز معلومات الرسالة
    const body = event.body || '';
    if (!body) return;

    const isGroup = event.isGroup;
    const messageType = event.attachments && event.attachments.length > 0 ? 'وسائط' : 'نص';
    const mediaUrl = event.attachments && event.attachments.length > 0 ? event.attachments[0].url || 'غير متوفر' : 'غير متوفر';
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const logMessage = `${time} - ${userName} (${isGroup ? 'مجموعة' : 'خاص'}) - النوع: ${messageType} - الرسالة: ${body} - رابط الوسائط: ${mediaUrl}`;
    log('info', logMessage);

    // معالجة الردود على الرسائل
    if (event.messageReply) {
      const { handleReply } = global.client;
      const { messageID, threadID, messageReply } = event;
      if (handleReply.length > 0) {
        const reply = handleReply.find(r => r.messageID === messageReply.messageID);
        if (reply) {
          const command = global.client.commands.get(reply.name);
          if (command && command.handleReply) {
            await command.handleReply({ event, api, handleReply: reply });
          }
        }
      }
    }

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
