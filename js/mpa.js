(() => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("q");
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form || !input) return;

  // ✅ 우리회사 고정 주소 (여기만 바꿔주세요)
  const COMPANY_ADDR = "서울특별시 중구 세종대로 110"; // <-- 너희 회사 주소로 변경

  // ✅ 허용 지역 정의
  const ALLOW = {
    "서울특별시": null, // 전체 허용
    "인천광역시": null, // 전체 허용
    "경기도": [
      "고양시", "파주시", "시흥시", "안산시", "군포시",
      "수원시", "화성시", "용인시", "안양시", "과천시",
      "광명시", "의왕시", "의정부시", "구리시", "성남시", "남양주시"
    ]
  };

  // 약칭 처리
  const SIDO_ALIAS = {
    "서울": "서울특별시",
    "인천": "인천광역시",
    "경기": "경기도"
  };

  // 동/지역 키워드 보강 (짧은 입력 대응)
  const EXTRA_KEYWORDS = ["일산", "영종", "강화", "석남", "청라", "송도", "마곡"];

  // ====== 중복/연타 방지 + 캐싱 설정 ======
  const DEBOUNCE_MS = 600;             // 엔터/클릭 연타 방지
  const CACHE_TTL_MS = 10 * 60 * 1000; // 캐시 유지 시간(10분)

  let isBusy = false;       // 진행 중 여부(중복 submit 방지)
  let lastSubmitAt = 0;     // 최근 submit 시각(연타 방지)

  // key: 정규화된 문자열, value: { ts, allowed, raw }
  const cache = new Map();

  const normalize = (s) =>
    String(s || "")
      .trim()
      .replace(/\s+/g, " ");

  const normalizeKey = (s) => normalize(s).toLowerCase();

  const cacheGet = (key) => {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() - item.ts > CACHE_TTL_MS) {
      cache.delete(key);
      return null;
    }
    return item;
  };

  const cacheSet = (key, value) => {
    cache.set(key, { ts: Date.now(), ...value });
  };

  const setBusyUI = (busy) => {
    isBusy = busy;
    input.disabled = busy;

    if (submitBtn) {
      submitBtn.disabled = busy;
      submitBtn.textContent = busy ? "검색중..." : "검색";
    }
  };

  // "의왕시" 목록이 있어도 사용자가 "의왕"이라고 치면 통과시키기 위한 헬퍼
  const matchCity = (q, city) => {
    const base = city.replace(/(시|군|구)$/, "");
    return q.includes(city) || q.includes(base);
  };

  const isAllowed = (raw) => {
    const q = normalize(raw);
    if (!q) return false;

    // 1) 키워드로 빠른 허용
    if (EXTRA_KEYWORDS.some((k) => q.includes(k))) return true;

    // 1.5) 시/도 없이도 "경기도 허용 도시명"만 입력하면 허용
    const gyeonggiList = ALLOW["경기도"];
    if (gyeonggiList?.some((city) => matchCity(q, city))) return true;

    // 2) 시/도 판별
    let sido = Object.keys(ALLOW).find((k) => q.includes(k));

    if (!sido) {
      const alias = Object.keys(SIDO_ALIAS).find((k) => q.includes(k));
      if (alias) sido = SIDO_ALIAS[alias];
    }

    if (!sido) return false;

    // 3) 서울/인천은 전체 허용
    if (ALLOW[sido] === null) return true;

    // 4) 경기도는 시 단위 체크
    return ALLOW[sido].some((city) => matchCity(q, city));
  };

  // ✅ 네이버지도 길찾기 URL 만들기
  // (사용자 입력 주소 -> 우리회사 주소)
  const buildDirectionsUrl = (fromAddr, toAddr) => {
    // 네이버지도 최신 UI는 보통 /p/directions 를 사용
    // "출발/도착 주소"만 넣어도 길찾기 화면에서 거리/시간이 뜸
    return (
      "https://map.naver.com/p/directions/" +
      encodeURIComponent(fromAddr) +
      "/" +
      encodeURIComponent(toAddr)
    );
  };

  const openDirections = (userQueryRaw) => {
    const fromAddr = userQueryRaw;    // 사용자가 입력한 주소/지역
    const toAddr = COMPANY_ADDR;      // 우리회사 고정 주소
    const url = buildDirectionsUrl(fromAddr, toAddr);

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handle = () => {
    // 1) 연타 방지
    const now = Date.now();
    if (now - lastSubmitAt < DEBOUNCE_MS) return;
    lastSubmitAt = now;

    // 2) 진행 중이면 무시
    if (isBusy) return;

    const value = normalize(input.value);
    if (!value) {
      alert("지역/주소를 입력해주세요.");
      return;
    }

    const key = normalizeKey(value);

    // 3) 캐시가 있으면 즉시 처리
    const cached = cacheGet(key);
    if (cached) {
      if (cached.allowed) {
        openDirections(cached.raw); // ✅ 검색 대신 길찾기 열기
        location.href = `installation.html?q=${encodeURIComponent(cached.raw)}`;
      } else {
        location.href = `connection.html?q=${encodeURIComponent(cached.raw)}`;
      }
      return;
    }

    // 4) 새 처리
    setBusyUI(true);
    try {
      const allowed = isAllowed(value);

      // 캐시에 저장
      cacheSet(key, { allowed, raw: value });

      if (allowed) {
        openDirections(value); // ✅ 검색 대신 길찾기 열기
        location.href = `installation.html?q=${encodeURIComponent(value)}`;
      } else {
        location.href = `connection.html?q=${encodeURIComponent(value)}`;
      }
    } finally {
      setBusyUI(false);
    }
  };

  // submit(엔터/검색 버튼)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handle();
  });

  // 엔터가 중복 트리거되는 경우 보강
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handle();
    }
  });
})();
