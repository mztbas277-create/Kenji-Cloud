const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: 'بانكاي',
    version: '2.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true,
    description: 'يطرد عضو من القروب (منشن / رد) مع إرسال صورة قبل الطرد',
    category: 'group',
    guide: {
      en: '{pn} @user | {pn} (reply)'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      let targetID = null;

      // 1️⃣ لو في رد على رسالة
      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      }
      // 2️⃣ لو في منشن
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      // 3️⃣ لو كتب UID
      else if (args.length > 0) {
        targetID = args[0];
      }

      if (!targetID) {
        return api.sendMessage(
          "❌ بانكاي: منشن العضو أو رد على رسالته علشان أطرده.",
          event.threadID
        );
      }

      // مسار الصورة
      const imagePath = path.join(__dirname, "bankai.jpg"); 
      // تأكد إن الصورة موجودة بنفس الاسم

      // رسالة بالصورة قبل الطرد
      const msgWithImage = {
        body: "🔥 بانكاي: تم إصدار أمر الطرد...",
        attachment: fs.existsSync(imagePath)
          ? fs.createReadStream(imagePath)
          : null
      };

      api.sendMessage(msgWithImage, event.threadID, (err) => {
        if (err) console.log("Error sending image:", err);

        // بعد إرسال الصورة ➜ نطرد العضو
        api.removeUserFromGroup(targetID, event.threadID, (kickErr) => {
          if (kickErr) {
            console.error("Failed to kick user:", kickErr);
            return api.sendMessage(
              "ارفع ادمن اول عشان احشو ヾ'•ิ⃝-•ิノ.",
              event.threadID
            );
          }

          api.sendMessage(
            `✅ بانكاي: تم طرد العضو بنجاح.`,
            event.threadID
          );
        });
      });

    } catch (error) {
      console.error("Error in بانكاي command:", error);
      api.sendMessage(
        "⚠️ بانكاي: حصل خطأ أثناء تنفيذ الأمر.",
        event.threadID
      );
    }
  },
};
