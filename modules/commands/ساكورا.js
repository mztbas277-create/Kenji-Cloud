/* ===============================
   5) الذكاء الاصطناعي (شخصية ذكية زي ChatGPT)
=============================== */
const aiProcess = async (command) => {
  const prompt = `
أنتِ مساعد ذكي اسمك "ساكورا".
أسلوبك مثل ChatGPT:
- تشرحين الأمور بوضوح وبالخطوات.
- تساعدين في البرمجة وحل المشاكل.
- لغتك عربية فصيحة وبسيطة.
- محترمة، غير رومانسية، وغير تمثيلية.
- تركّزين على الفائدة العملية.

رسالة المستخدم:
"${command}"
  `;

  const apiUrl = `https://simsim-nexalo.vercel.app/api/chat/${encodeURIComponent(prompt)}/ar`;

  try {
    const response = await axios.get(apiUrl);

    if (response.data && response.data.answer) {
      // لو الرد طلع إنجليزي بالغلط نعرّبه
      return await translateToArabic(response.data.answer);
    }

    return "ما فهمت طلبك تمامًا، ممكن توضحه لي أكتر؟";
  } catch (error) {
    console.error('[Sakura AI] Error:', error.message);
    return "حصل خطأ تقني مؤقت، جرّب مرة تانية بعد شوية.";
  }
};
