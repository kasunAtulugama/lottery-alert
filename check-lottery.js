const axios = require("axios");
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

const today = new Date();
const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

const url = `https://lklottery.com/api/lklottery/lklottery_pdf_files/lklottery_results_Sinhala_${dateStr}.pdf`;

async function run() {
  try {
    await axios.head(url);
    await client.messages.create({
      from: "whatsapp:+14155238886",
      to: "whatsapp:+94XXXXXXXXX", // replace with your number
      body: `🎉 Lottery PDF available!\n${url}`
    });
    console.log("📲 WhatsApp alert sent");
  } catch {
    console.log("⏳ PDF not available yet");
  }
}

run();
