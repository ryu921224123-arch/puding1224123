export default async function handler(req, res) {
  try {
    const { start, goal } = req.query;

    if (!start || !goal) {
      return res.status(400).json({ error: 'start or goal missing' });
    }

    const url =
      `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving` +
      `?start=${encodeURIComponent(start)}` +
      `&goal=${encodeURIComponent(goal)}` +
      `&option=traoptimal`;

    const response = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAP_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_MAP_CLIENT_SECRET,
      },
    });

    const text = await response.text(); // 🔥 중요
    console.log('NAVER RAW RESPONSE:', text);

    res.status(response.status).send(text);
  } catch (err) {
    console.error('API ERROR:', err);
    res.status(500).json({ error: err.message });
  }
}
