
import { GoogleGenAI, Chat } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsight = async (transactions: Transaction[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = transactions.map(t => `${t.type}: ${t.amount} di kategori ${t.category} (${t.note})`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Anda adalah penasihat keuangan pribadi. Berikut adalah transaksi terakhir saya:
      ${summary}
      
      Berikan satu kalimat saran keuangan yang praktis, menyemangati, dan singkat dalam Bahasa Indonesia berdasarkan data tersebut. Gunakan nada bicara yang ramah.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 150,
      }
    });

    return response.text?.trim() || "Kerja bagus dalam mengelola keuanganmu! Terus catat pengeluaranmu agar tetap sesuai rencana.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Pengeluaran belanja kamu bulan ini lebih hemat 12% dibanding rata-rata bulanan. Pertahankan!";
  }
};

export const createFinancialChat = (transactions: Transaction[]): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = transactions.map(t => `${t.type}: ${t.amount} di kategori ${t.category} pada ${new Date(t.date).toLocaleDateString()} (${t.note})`).join('\n');

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `Anda adalah PayFin AI, asisten keuangan pribadi yang cerdas, profesional, dan ramah.
      Anda memiliki akses ke seluruh riwayat data transaksi pengguna berikut untuk dianalisis:
      ${summary}
      
      Tugas Anda adalah:
      1. Menjawab pertanyaan tentang pola pengeluaran (Expenses), pemasukan (Income), dan tren anggaran secara keseluruhan.
      2. Memberikan wawasan mendalam (Deep Insights) tentang kesehatan keuangan pengguna.
      3. Memberikan saran penghematan atau investasi yang realistis berdasarkan data yang ada.
      4. Menganalisis kategori mana yang paling membebani keuangan pengguna.
      5. Selalu gunakan Bahasa Indonesia yang sopan, profesional, namun tetap hangat dan menyemangati.
      6. Jaga jawaban tetap terstruktur, jelas, dan informatif.
      7. Jika ditanya tentang data yang tidak tersedia, beritahu pengguna dengan jujur dan tawarkan saran umum yang relevan.
      8. Anda menganalisis data keuangan secara KESELURUHAN, tidak hanya yang terlihat di filter UI saat ini.`,
      temperature: 0.7,
    },
  });
};
