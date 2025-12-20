// MY-APP/api/send-push.js

export default async function handler(req, res) {
  // POSTメソッド以外は拒否
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { to, title, body, data } = req.body;

    const message = {
      to,
      sound: 'default',
      title,
      body,
      data,
    };

    // Expoへ通知リクエストを送信
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}