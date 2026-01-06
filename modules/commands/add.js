module.exports = {
  config: {
    name: 'ضيف',
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true,
    description: 'إضافة عضو إلى القروب.',
    category: 'group',
    guide: {
      en: '{pn} [uid|@منشن]'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      let targetID;

      // لو في منشن
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];

      // لو كتب UID
      } else if (args.length > 0) {
        targetID = args[0];

      // لو ما كتب شي
      } else {
        return api.sendMessage(
          '❌ من فضلك اكتب UID العضو أو اعمل له منشن.',
          event.threadID
        );
      }

      if (!targetID) {
        return api.sendMessage(
          '⚠️ العضو غير صحيح.',
          event.threadID
        );
      }

      api.addUserToGroup(targetID, event.threadID, (err) => {
        if (err) {
          console.error("فشل في إضافة العضو:", err);
          return api.sendMessage(
            '❌ فشل في إضافة العضو.\nتأكد أن العضو صديق للبوت أو أن للبوت صلاحية الإضافة.',
            event.threadID
          );
        }

        api.sendMessage(
          `✅ تم إضافة العضو بنجاح إلى القروب.`,
          event.threadID
        );
      });

    } catch (error) {
      console.error("خطأ في أمر الإضافة:", error);
      api.sendMessage(
        'حدث خطأ أثناء محاولة إضافة العضو.',
        event.threadID
      );
    }
  },
};
