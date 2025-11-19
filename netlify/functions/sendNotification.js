// netlify/functions/notify.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ADMIN_REST_KEY = process.env.ONESIGNAL_ADMIN_REST_KEY;
  const CUSTOMER_REST_KEY = process.env.ONESIGNAL_CUSTOMER_REST_KEY;

  const ADMIN_APP_ID = "fb14d9b6-5b07-47c7-bc70-ff2495372d38";
  const CUSTOMER_APP_ID = "4d4396ed-4766-4646-8449-07fa9c7db4f1";

  try {
    const body = JSON.parse(event.body || "{}");
    const { type, data } = body;

    if (!type || !data) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing 'type' or 'data'" }) };
    }

    let app_id, rest_key, headings, contents, imageUrl;

    if (type === "new_complaint") {
      app_id = ADMIN_APP_ID;
      rest_key = ADMIN_REST_KEY;
      headings = { ar: "Cesaro" };
      contents = { ar: `شكوى جديدة من: ${data.customer_name || "عميل"}` };
      imageUrl = null; // لا صورة للشكاوى
    } else if (type === "broadcast_to_customers") {
      app_id = CUSTOMER_APP_ID;
      rest_key = CUSTOMER_REST_KEY;
      headings = { ar: data.title || "Cesaro" };
      contents = { ar: data.message || "إشعار جديد" };
      imageUrl = data.imageUrl || null;
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid notification type" }) };
    }

    if (!rest_key) {
      console.error("Missing REST key for type:", type);
      return { statusCode: 500, body: JSON.stringify({ error: "Server config error" }) };
    }

    const payload = {
      app_id,
      included_segments: ["Subscribed Users"],
      headings,
      contents,
      url: "https://calamari-message.netlify.app/",
    };

    if (imageUrl) {
      payload.chrome_web_image = imageUrl;
      payload.big_picture = imageUrl;
    }

    const auth = Buffer.from(`:${rest_key}`).toString("base64");
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return {
      statusCode: response.status,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error("Function error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
