// netlify/functions/sendNotification.js

const ONESIGNAL_APP_ID = "4d4396ed-4766-4646-8449-07fa9c7db4f1";
const ONESIGNAL_REST_KEY = "os_v2_app_jvbzn3khmzdenbcja75jy7nu6fa5eymgz2cu4jvhtdjylyzs3qpoirivgqpmndhcpqy6yuorx6nw6t2mwerbpemst6vufail7k7gzxa";

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
