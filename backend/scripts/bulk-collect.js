/**
 * 전체 지역 벌크 수집 스크립트
 * 로컬 백엔드(포트 3099)를 통해 모든 지역의 거래 데이터 수집
 */
const https = require('https');
const http = require('http');
const pg = require('pg');

const BACKEND_URL = 'http://localhost:3099/api/v1';
const MONTHS = 6;
const DB_URL = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

function collectRegion(lawdCd, months) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ lawdCd, months });
    const options = {
      hostname: 'localhost',
      port: 3099,
      path: '/api/v1/collector/collect-recent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 180000,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const total = json?.data?.total ?? json?.total ?? 0;
          resolve({ success: true, total });
        } catch {
          resolve({ success: false, total: 0 });
        }
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ success: false, total: 0, error: 'timeout' }); });
    req.on('error', (e) => resolve({ success: false, total: 0, error: e.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  // 거래 데이터가 없는 지역만 수집 (효율화)
  const res = await pool.query(`
    SELECT r.lawd_cd, r.sigungu_name, r.dong_name
    FROM regions r
    LEFT JOIN (
      SELECT region_id, COUNT(*) as cnt FROM real_transactions GROUP BY region_id
    ) t ON t.region_id = r.id
    WHERE t.cnt IS NULL OR t.cnt = 0
    ORDER BY r.sido_name, r.sigungu_name, r.dong_name
  `);

  const regions = res.rows;
  console.log(`=== 데이터 없는 지역 ${regions.length}개 수집 시작 ===\n`);

  let success = 0, total = 0;

  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    process.stdout.write(`[${i+1}/${regions.length}] ${r.sigungu_name} ${r.dong_name} (${r.lawd_cd})... `);
    const result = await collectRegion(r.lawd_cd, MONTHS);
    if (result.success) {
      success++;
      total += result.total;
      console.log(`✅ ${result.total}건`);
    } else {
      console.log(`❌ ${result.error || '실패'}`);
    }
    // Rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== 완료: ${success}/${regions.length} 성공, 총 ${total}건 수집 ===`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
