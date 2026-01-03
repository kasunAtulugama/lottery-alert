const axios = require("axios");
const twilio = require("twilio");

// ---------------- CONFIG ----------------

const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH;

const FROM_WHATSAPP = "whatsapp:+14155238886"; // Twilio sandbox
const TO_WHATSAPP = process.env.TO_WHATSAPP;   // Your number

const client = twilio(TWILIO_SID, TWILIO_AUTH);

// ---------------- STATE ----------------
let alertSentDate = null;

// ---------------- HELPERS ----------------
function getSriLankaDateTime() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Colombo" }));
}

function getTodaySL() {
  return getSriLankaDateTime().toISOString().split("T")[0];
}

function getWeekdayName(date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(date).getDay()];
}

function buildPdfUrl(date) {
  const ymd = date.replace(/-/g, "");
  const day = getWeekdayName(date);
  return `https://lklottery.com/api/lklottery/lklottery_pdf_files/lklottery_results_Sinhala_${ymd}_${day}.pdf`;
}

function isWithinCheckWindow() {
  const now = getSriLankaDateTime();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // From 22:30 (10:30 PM) onwards
  return hour > 22 || (hour === 22 && minute >= 30);
}

// ---------------- MAIN ----------------
async function checkPdf() {
  try {
    const today = getTodaySL();

    // Reset daily
    if (alertSentDate !== today) {
      alertSentDate = null;
    }

    if (!isWithinCheckWindow()) {
      console.log("⏳ Outside checking window (before 10:30 PM)");
      return;
    }

    if (alertSentDate === today) {
      console.log("✅ Alert already sent today");
      return;
    }

    const pdfUrl = buildPdfUrl(today);
    console.log(`🔍 Checking PDF for ${today}`);
    console.log(`🔗 ${pdfUrl}`);

    const res = await axios.head(pdfUrl).catch(() => null);

    if (!res || res.status !== 200) {
      console.log("⏳ PDF not available yet");
      return;
    }

    await client.messages.create({
      from: FROM_WHATSAPP,
      to: TO_WHATSAPP,
      body: `🎉 Sri Lanka Lottery Results Available!\n\n📅 Date: ${today}\n🔗 ${pdfUrl}`,
    });

    alertSentDate = today;
    console.log("📲 WhatsApp alert sent");

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// ---------------- RUN ----------------
// Check every 10 minutes
setInterval(checkPdf, 1 * 60 * 1000);

// Initial check
checkPdf();
