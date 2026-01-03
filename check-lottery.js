const axios = require("axios");
const twilio = require("twilio");

// ---------------- CONFIG ----------------
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);
const TO_WHATSAPP = "whatsapp:+94XXXXXXXXX"; // replace with your number

// Track if alert has been sent today
let alertSentDate = null;

// ---------------- HELPERS ----------------
function getSriLankaDateTime() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" })
  );
}

// Get the date to check
function getTodaySL() {
  // If TEST_DATE is set, use it (format: YYYY-MM-DD)
  if (process.env.TEST_DATE) return process.env.TEST_DATE;
  return getSriLankaDateTime().toISOString().slice(0, 10);
}

// Check if current SL time is after 10:30 PM (ignore if testing)
function isAfter1030PM() {
  if (process.env.TEST_DATE) return true; // skip time check in test mode
  const now = getSriLankaDateTime();
  const hour = now.getHours();
  const minute = now.getMinutes();
  return hour > 22 || (hour === 22 && minute >= 30);
}

// Build PDF URL
function buildPdfUrl(date) {
  const ymd = date.replace(/-/g, "");
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(date).getDay()];
  return `https://lklottery.com/api/lklottery/lklottery_pdf_files/lklottery_results_Sinhala_${ymd}_${weekday}.pdf`;
}

// ---------------- MAIN ----------------
async function checkLottery() {
  try {
    const today = getTodaySL();

    // Reset daily
    if (alertSentDate !== today) alertSentDate = null;

    if (!isAfter1030PM()) {
      console.log("⏳ Before 10:30 PM SL — skipping check");
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
      from: "whatsapp:+14155238886",
      to: TO_WHATSAPP,
      body: `🎉 Lottery PDF is now available!\n\n📅 Date: ${today}\n🔗 ${pdfUrl}`,
    });

    alertSentDate = today;
    console.log("📲 WhatsApp alert sent");

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// ---------------- RUN ----------------
checkLottery();

