export default async function handler(req, res) {
  const { start, goal } = req.query;

  console.log('start:', start);
  console.log('goal:', goal);

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

  const data = await response.json();
  res.status(200).json(data);
}
