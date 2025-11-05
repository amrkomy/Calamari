// netlify/functions/sendNotification.js

const ONESIGNAL_APP_ID = "1def250f-bed4-4f41-b46b-0126e442efbc";
const ONESIGNAL_REST_KEY = "os_v2_app_dxxskd562rhudndlaetoiqxpxq6ptuj23i4ev2ev7hckgqj3qpxazhe4lankchezg3r6m6nxalxi6xd6yiobiognbtxmg2wlwhvcltq";

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
