export default async function handler(req, res) {
  const { start, goal } = req.query;

  if (!start || !goal) {
    return res.status(400).json({
      error: 'start and goal are required',
    });
  }

  try {
    const response = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAP_CLIENT_ID,
          'X-NCP-APIGW-API-KEY': process.env.NAVER_MAP_CLIENT_SECRET,
        },
      }
    );

    const data = await response.json();

    const route = data.route?.traoptimal?.[0];
    if (!route) {
      return res.status(500).json({ error: '경로 계산 실패' });
    }

    res.status(200).json({
      distance: route.summary.distance, // meter
      duration: route.summary.duration, // ms
    });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
}
