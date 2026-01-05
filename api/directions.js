export default async function handler(req, res) {
  const { start, goal } = req.query;

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

  // 🔥 전체 응답 그대로 반환
  res.status(200).json(data);
}
