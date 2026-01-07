const fs = require('fs');
const path = require('path');

const userDBPath = path.join(__dirname, '..', '..', 'database', 'users.json');
const cooldownsPath = path.join(__dirname, '..', '..', 'database', 'cooldowns.json');

function readDB(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        console.error(`خطأ عند قراءة قاعدة البيانات في ${filePath}:`, error);
        return {};
    }
}

function writeDB(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`خطأ عند كتابة قاعدة البيانات في ${filePath}:`, error);
    }
}

module.exports = {
    config: {
        name: 'اشتغل', // تم تغيير اسم الأمر
        version: '1.0',
        author: 'Hridoy',
        aliases: ['w'],
        countDown: 24 * 60 * 60, // 24 ساعة
        prefix: true,
        groupAdminOnly: false,
        description: 'اعمل لكسب المال. فترة الانتظار 24 ساعة.',
        category: 'economy',
        guide: {
            en: '   {pn}'
        },
    },

    onStart: async ({ api, event }) => {
        const { senderID } = event;
        const commandName = 'اشتغل';

        const cooldowns = readDB(cooldownsPath);
        const userCooldownKey = `${senderID}_${commandName}`;
        const now = Date.now();
        const cooldownTime = module.exports.config.countDown * 1000;

        if (cooldowns[userCooldownKey] && (now - cooldowns[userCooldownKey] < cooldownTime)) {
            const remainingMs = cooldowns[userCooldownKey] + cooldownTime - now;
            const totalSeconds = Math.floor(remainingMs / 1000);
            const days = Math.floor(totalSeconds / (24 * 3600));
            const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            let timeString = '';
            if (days > 0) timeString += `${days} يوم `;
            if (hours > 0) timeString += `${hours} ساعة `;
            if (minutes > 0) timeString += `${minutes} دقيقة `;
            if (seconds > 0) timeString += `${seconds} ثانية`;

            return api.sendMessage(`🕒 لقد عملت مسبقًا. الرجاء الانتظار ${timeString.trim()} قبل العمل مرة أخرى.`, event.threadID);
        }

        const userDB = readDB(userDBPath);

        if (!userDB[senderID]) {
            userDB[senderID] = {
                name: (await api.getUserInfo(senderID))[senderID].name,
                joinDate: new Date().toISOString(),
                messageCount: 0,
                isAdmin: false,
                isBanned: false,
                lastActive: new Date().toISOString(),
                rank: 1,
                xp: 0,
                totalxp: 0,
                balance: 0
            };
        }

        const amount = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
        userDB[senderID].balance += amount;

        cooldowns[userCooldownKey] = now;

        writeDB(userDBPath, userDB);
        writeDB(cooldownsPath, cooldowns);

        return api.sendMessage(`💼 لقد عملت بجد وربحت ${amount} عملة.\n💰 رصيدك الجديد هو ${userDB[senderID].balance} عملة.`, event.threadID);
    },
};
