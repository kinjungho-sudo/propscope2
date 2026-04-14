/**
 * 서울+경기 전체 동(洞) 자동 시딩 스크립트
 * MOLIT API로 실제 거래가 있는 동을 발견하고 DB에 등록
 */
const pg = require('pg');
const https = require('https');
const { URL, URLSearchParams } = require('url');

const MOLIT_API_KEY = process.env.MOLIT_API_KEY || 'ad79c4d1eebe3c4291c365eff621f01fcf28538d953ebf503cd0ee90ef4d4cb5';
const DB_URL = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

// 서울 25개 구 sigungu 코드
const SEOUL_SIGUNGUS = [
  { code: '11110', name: '종로구',    sido: '서울특별시' },
  { code: '11140', name: '중구',      sido: '서울특별시' },
  { code: '11170', name: '용산구',    sido: '서울특별시' },
  { code: '11200', name: '성동구',    sido: '서울특별시' },
  { code: '11215', name: '광진구',    sido: '서울특별시' },
  { code: '11230', name: '동대문구',  sido: '서울특별시' },
  { code: '11260', name: '중랑구',    sido: '서울특별시' },
  { code: '11290', name: '성북구',    sido: '서울특별시' },
  { code: '11305', name: '강북구',    sido: '서울특별시' },
  { code: '11320', name: '도봉구',    sido: '서울특별시' },
  { code: '11350', name: '노원구',    sido: '서울특별시' },
  { code: '11380', name: '은평구',    sido: '서울특별시' },
  { code: '11410', name: '서대문구',  sido: '서울특별시' },
  { code: '11440', name: '마포구',    sido: '서울특별시' },
  { code: '11470', name: '양천구',    sido: '서울특별시' },
  { code: '11500', name: '강서구',    sido: '서울특별시' },
  { code: '11530', name: '구로구',    sido: '서울특별시' },
  { code: '11545', name: '금천구',    sido: '서울특별시' },
  { code: '11560', name: '영등포구',  sido: '서울특별시' },
  { code: '11590', name: '동작구',    sido: '서울특별시' },
  { code: '11620', name: '관악구',    sido: '서울특별시' },
  { code: '11650', name: '서초구',    sido: '서울특별시' },
  { code: '11680', name: '강남구',    sido: '서울특별시' },
  { code: '11710', name: '송파구',    sido: '서울특별시' },
  { code: '11740', name: '강동구',    sido: '서울특별시' },
];

// 경기도 주요 시군구
const GYEONGGI_SIGUNGUS = [
  { code: '41110', name: '장안구', sido: '경기도', sigunguParent: '수원시' },
  { code: '41113', name: '권선구', sido: '경기도', sigunguParent: '수원시' },
  { code: '41115', name: '팔달구', sido: '경기도', sigunguParent: '수원시' },
  { code: '41117', name: '영통구', sido: '경기도', sigunguParent: '수원시' },
  { code: '41130', name: '수정구', sido: '경기도', sigunguParent: '성남시' },
  { code: '41131', name: '중원구', sido: '경기도', sigunguParent: '성남시' },
  { code: '41135', name: '분당구', sido: '경기도', sigunguParent: '성남시' },
  { code: '41150', name: '의정부시', sido: '경기도' },
  { code: '41170', name: '만안구', sido: '경기도', sigunguParent: '안양시' },
  { code: '41171', name: '동안구', sido: '경기도', sigunguParent: '안양시' },
  { code: '41190', name: '부천시', sido: '경기도' },
  { code: '41210', name: '광명시', sido: '경기도' },
  { code: '41220', name: '평택시', sido: '경기도' },
  { code: '41270', name: '상록구', sido: '경기도', sigunguParent: '안산시' },
  { code: '41271', name: '단원구', sido: '경기도', sigunguParent: '안산시' },
  { code: '41280', name: '덕양구', sido: '경기도', sigunguParent: '고양시' },
  { code: '41285', name: '일산동구', sido: '경기도', sigunguParent: '고양시' },
  { code: '41287', name: '일산서구', sido: '경기도', sigunguParent: '고양시' },
  { code: '41290', name: '과천시', sido: '경기도' },
  { code: '41310', name: '구리시', sido: '경기도' },
  { code: '41360', name: '남양주시', sido: '경기도' },
  { code: '41370', name: '오산시', sido: '경기도' },
  { code: '41390', name: '시흥시', sido: '경기도' },
  { code: '41410', name: '군포시', sido: '경기도' },
  { code: '41430', name: '의왕시', sido: '경기도' },
  { code: '41450', name: '하남시', sido: '경기도' },
  { code: '41461', name: '처인구', sido: '경기도', sigunguParent: '용인시' },
  { code: '41463', name: '기흥구', sido: '경기도', sigunguParent: '용인시' },
  { code: '41465', name: '수지구', sido: '경기도', sigunguParent: '용인시' },
  { code: '41480', name: '파주시', sido: '경기도' },
  { code: '41500', name: '이천시', sido: '경기도' },
  { code: '41550', name: '안성시', sido: '경기도' },
  { code: '41570', name: '김포시', sido: '경기도' },
  { code: '41590', name: '화성시', sido: '경기도' },
  { code: '41610', name: '광주시', sido: '경기도' },
  { code: '41630', name: '양주시', sido: '경기도' },
  { code: '41650', name: '포천시', sido: '경기도' },
  { code: '41670', name: '여주시', sido: '경기도' },
  { code: '41820', name: '인천 연수구', sido: '인천광역시' },
  { code: '28110', name: '중구',  sido: '인천광역시' },
  { code: '28140', name: '동구',  sido: '인천광역시' },
  { code: '28177', name: '미추홀구', sido: '인천광역시' },
  { code: '28185', name: '연수구', sido: '인천광역시' },
  { code: '28200', name: '남동구', sido: '인천광역시' },
  { code: '28237', name: '부평구', sido: '인천광역시' },
  { code: '28245', name: '계양구', sido: '인천광역시' },
  { code: '28260', name: '서구',  sido: '인천광역시' },
];

const ALL_SIGUNGUS = [...SEOUL_SIGUNGUS, ...GYEONGGI_SIGUNGUS];

function fetchMolit(sigunguCode, dealYmd, endpoint) {
  return new Promise((resolve) => {
    const qs = new URLSearchParams({
      LAWD_CD: sigunguCode,
      DEAL_YMD: dealYmd,
      numOfRows: '1000',
      pageNo: '1',
    }).toString();
    const url = `https://apis.data.go.kr/1613000/${endpoint}?serviceKey=${encodeURIComponent(MOLIT_API_KEY)}&${qs}`;

    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // JSON 파싱 시도
          if (data.trimStart().startsWith('{')) {
            const j = JSON.parse(data);
            const items = j?.response?.body?.items?.item;
            resolve(items ? (Array.isArray(items) ? items : [items]) : []);
          } else {
            // XML 파싱
            const matches = data.matchAll(/<item>([\s\S]*?)<\/item>/g);
            const items = [];
            for (const m of matches) {
              const block = m[1];
              const get = (tag) => { const r = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`)); return r ? r[1].trim() : ''; };
              items.push({ umdNm: get('umdNm'), dealYear: get('dealYear'), dealMonth: get('dealMonth') });
            }
            resolve(items);
          }
        } catch { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

function hashDongCode(dongName, existingCodes) {
  // 동 이름 → 고유 3자리 코드 생성
  // 기존 코드와 충돌 안 하는 값 찾기
  let h = 0;
  for (const c of dongName) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  let code = (100 + (h % 899)).toString();
  while (existingCodes.has(code)) {
    h = (h + 1) & 0xffff;
    code = (100 + (h % 899)).toString();
  }
  return code;
}

async function getExistingRegions(sigunguCode) {
  const res = await pool.query(
    'SELECT lawd_cd, dong_name FROM regions WHERE sigungu_code = $1',
    [sigunguCode]
  );
  return new Map(res.rows.map(r => [r.dong_name, r.lawd_cd]));
}

async function createRegion({ sigunguCode, sigunguName, sidoCode, sidoName, dongName, lawdCd }) {
  const sidoCodeStr = sigunguCode.slice(0, 2);
  const dongCode = lawdCd.slice(5, 8);
  try {
    await pool.query(
      `INSERT INTO regions (id, lawd_cd, sido_code, sigungu_code, dong_code, sido_name, sigungu_name, dong_name, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (lawd_cd) DO NOTHING`,
      [lawdCd, sidoCodeStr, sigunguCode, dongCode, sidoName, sigunguName, dongName]
    );
    return true;
  } catch (e) {
    console.error(`  ❌ ${sigunguName} ${dongName}: ${e.message}`);
    return false;
  }
}

async function processSigngu(sg) {
  const sigunguName = sg.sigunguParent ? `${sg.sigunguParent} ${sg.name}` : sg.name;
  const sidoCode = sg.code.slice(0, 2);
  const months = ['202503', '202502', '202501', '202412'];

  // 이 sigungu에서 동 이름 수집
  const dongNames = new Set();
  for (const month of months) {
    const [villa, offi] = await Promise.all([
      fetchMolit(sg.code, month, 'RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade'),
      fetchMolit(sg.code, month, 'RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade'),
    ]);
    [...villa, ...offi].forEach(item => {
      if (item.umdNm) dongNames.add(item.umdNm.trim());
    });
    if (dongNames.size > 0) break; // 하나라도 발견되면 충분
  }

  if (dongNames.size === 0) {
    console.log(`  ⚠️  ${sigunguName}: 거래 데이터 없음`);
    return 0;
  }

  // 기존 DB 동 목록
  const existing = await getExistingRegions(sg.code);
  const existingCodes = new Set([...existing.values()].map(lc => lc.slice(5, 8)));

  let created = 0;
  for (const dongName of dongNames) {
    if (existing.has(dongName)) continue; // 이미 존재

    // 새 lawdCd 생성
    const dongCode = hashDongCode(dongName + sg.code, existingCodes);
    existingCodes.add(dongCode);
    const lawdCd = sg.code + dongCode + '00';

    const ok = await createRegion({
      sigunguCode: sg.code,
      sigunguName,
      sidoCode,
      sidoName: sg.sido,
      dongName,
      lawdCd,
    });
    if (ok) {
      created++;
      console.log(`  ✅ 추가: ${sigunguName} ${dongName} (${lawdCd})`);
    }
  }

  return created;
}

async function main() {
  console.log('=== 서울+경기+인천 전체 동 시딩 시작 ===\n');
  let total = 0;

  for (const sg of ALL_SIGUNGUS) {
    const sigunguName = sg.sigunguParent ? `${sg.sigunguParent} ${sg.name}` : sg.name;
    process.stdout.write(`[${sg.code}] ${sigunguName} 처리 중... `);
    const created = await processSigngu(sg);
    console.log(`→ ${created}개 추가`);
    total += created;

    // API rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== 완료: 총 ${total}개 동 추가 ===`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
