// netlify/functions/sendNotification.js

const ONESIGNAL_APP_ID = "87df0562-367c-4029-a0b2-c6b6f79b59b9";
const ONESIGNAL_REST_KEY = "os_v2_app_q7pqkyrwpractifsy23ppg2zxfu2guj4rxgem346mvf2palxsb4p54xhwgnvdhakqno7ryujg2fdz23jagcpng6mm3nqexcwbnf5jly";

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
