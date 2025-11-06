// netlify/functions/sendNotification.js

const ONESIGNAL_APP_ID = "e59705ad-59b1-4b0b-beb4-a50a830bee8e";
const ONESIGNAL_REST_KEY = "os_v2_app_4wlqllkzwffqxpvuuufigc7oryfvv5b2yo3eb55rlr33hnt4c2u6v3vzwrbuy2ilj74ojup4cwm3zuz27nluiyorbxdvxkzfqby6lwi";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { title, message, imageUrl } = JSON.parse(event.body);

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
      Authorization: `Basic ${ONESIGNAL_REST_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(result),
  };
};
