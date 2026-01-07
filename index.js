const { spawn } = require('child_process');
const { log } = require('./logger/logger');

let botProcess;
let restartCount = 0;
const MAX_RESTARTS = 10; // زيادة عدد المحاولات قليلاً
const RESTART_DELAY = 5000;

function startBot() {
  if (botProcess) {
    log('info', 'إيقاف عملية البوت الحالية...');
    botProcess.kill(); 
  }

  log('info', 'تشغيل البوت...');
  botProcess = spawn('node', ['main.js'], { stdio: 'inherit' });

  botProcess.on('close', (code) => {
    log('info', `انتهت عملية البوت برمز الخروج ${code}`);
    if (code === 2) { 
      log('info', 'يتم إعادة تشغيل البوت...');
      setTimeout(startBot, RESTART_DELAY);
    } else if (code !== 0) { 
      restartCount++;
      if (restartCount <= MAX_RESTARTS) {
        log('warn', `إعادة تشغيل البوت بعد ${RESTART_DELAY / 1000} ثوانٍ... (محاولة ${restartCount}/${MAX_RESTARTS})`);
        setTimeout(startBot, RESTART_DELAY);
      } else {
        log('error', `توقف البوت بعد ${MAX_RESTARTS} محاولات. سيتم إعادة تشغيل دائم.`);
        restartCount = 0; // إعادة ضبط العداد
        setTimeout(startBot, RESTART_DELAY);
      }
    } else {
      log('info', 'انتهت عملية البوت بشكل طبيعي.');
      restartCount = 0; // إعادة ضبط العداد
    }
  });

  botProcess.on('error', (err) => {
    log('error', `فشل في تشغيل عملية البوت: ${err.message}`);
    setTimeout(startBot, RESTART_DELAY); // إعادة المحاولة دائمًا عند الخطأ
  });
}

startBot();

process.on('SIGINT', () => {
  log('info', 'تم اكتشاف Ctrl+C. جاري إيقاف البوت...');
  if (botProcess) {
    botProcess.kill();
  }
  process.exit(0);
});
