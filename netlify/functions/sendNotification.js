// netlify/functions/sendNotification.js

const ONESIGNAL_APP_ID = "4d4396ed-4766-4646-8449-07fa9c7db4f1";
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

exports.handler = async (event) => {
  // السماح فقط بـ POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // تأكد من وجود المفتاح في البيئة
  if (!ONESIGNAL_REST_KEY) {
    console.error("ONESIGNAL_REST_KEY is missing in environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server misconfiguration: missing API key." }),
    };
  }

  try {
    const { title, message, imageUrl } = JSON.parse(event.body || "{}");

    if (!title || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: title and message." }),
      };
    }

    // ⚠️ هذا هو الجزء المهم: ترميز المفتاح كـ Basic Auth صحيح
    const auth = Buffer.from(`:${ONESIGNAL_REST_KEY}`).toString("base64");

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["All"],
      headings: { en: title },
      contents: { en: message },
      chrome_web_image: imageUrl || undefined,
    };

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`, // ✅ صححنا هنا
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error.", details: error.message }),
    };
  }
};
