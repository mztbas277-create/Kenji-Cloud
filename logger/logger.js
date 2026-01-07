const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

const logDir = path.join(__dirname, 'logs');
fs.ensureDirSync(logDir);

const logFile = path.join(logDir, `log_${moment().format('YYYYMMDD')}.log`);

const log = (level, message) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  // حفظ السجل في الملف
  fs.appendFileSync(logFile, logMessage, { encoding: 'utf8' });

  // طباعة السجل في الكونسول مع تعريب النوع
  switch (level) {
    case 'info':
      console.log(`[INFO] [معلومات] ${timestamp} - ${message}`);
      break;
    case 'error':
      console.error(`[ERROR] [خطأ] ${timestamp} - ${message}`);
      break;
    case 'warn':
      console.warn(`[WARN] [تحذير] ${timestamp} - ${message}`);
      break;
  }
};

module.exports = { log };
