export default async function handler(req, res) {
  const { address } = req.query;

  const response = await fetch(
    `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
    {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAP_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_MAP_CLIENT_SECRET,
      },
    }
  );

  const data = await response.json();

  if (!data.addresses || data.addresses.length === 0) {
    return res.status(404).json({ error: '주소 없음' });
  }

  const { x, y } = data.addresses[0]; // x=경도, y=위도
  res.status(200).json({ lng: x, lat: y });
}
