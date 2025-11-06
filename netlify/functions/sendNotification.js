// netlify/functions/sendNotification.js

const ONESIGNAL_APP_ID = "4d4396ed-4766-4646-8449-07fa9c7db4f1";
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

exports.handler = async (event) => {
  // السماح فقط بطلبات POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  // التأكد من أن المفتاح موجود في بيئة Netlify
  if (!ONESIGNAL_REST_KEY) {
    console.error("❌ ONESIGNAL_REST_KEY is missing in Netlify environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server configuration error: missing OneSignal API key.",
      }),
    };
  }

  try {
    // تحليل جسم الطلب
    const body = event.body ? JSON.parse(event.body) : {};
    const { title, message, imageUrl } = body;

    // التحقق من وجود الحقول المطلوبة
    if (!title || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields: 'title' and 'message'.",
        }),
      };
    }

    // 🔑 تصحيح طريقة المصادقة مع OneSignal
    // يجب ترميز ":REST_API_KEY" كـ base64 لاستخدامه في Basic Auth
    const auth = Buffer.from(`:${ONESIGNAL_REST_KEY}`).toString("base64");

    // إعداد حمولة الإشعار
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["All"],
      headings: { en: title },
      contents: { en: message },
      chrome_web_image: imageUrl || undefined,
    };

    // إرسال الطلب إلى OneSignal
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`, // ✅ التنسيق الصحيح
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // إرجاع الاستجابة لواجهة المستخدم
    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("💥 Function error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error.",
        details: error.message,
      }),
    };
  }
};
