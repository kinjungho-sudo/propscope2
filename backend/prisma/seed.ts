import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// 법정동 코드 형식: 시도(2) + 시군구(3) + 읍면동(3) + 리(2) = 10자리
// sigunguCode = 5자리 (MOLIT LAWD_CD로 사용)
// lawdCd = 10자리 (Region 고유 식별자)

const regions = [
  // ========== 서울특별시 ==========
  // 강남구 (11680)
  { sidoCode: '11', sigunguCode: '11680', dongCode: '101', sidoName: '서울특별시', sigunguName: '강남구', dongName: '역삼동',   lawdCd: '1168010100' },
  { sidoCode: '11', sigunguCode: '11680', dongCode: '103', sidoName: '서울특별시', sigunguName: '강남구', dongName: '삼성동',   lawdCd: '1168010300' },
  { sidoCode: '11', sigunguCode: '11680', dongCode: '106', sidoName: '서울특별시', sigunguName: '강남구', dongName: '도곡동',   lawdCd: '1168010600' },
  { sidoCode: '11', sigunguCode: '11680', dongCode: '107', sidoName: '서울특별시', sigunguName: '강남구', dongName: '개포동',   lawdCd: '1168010700' },
  { sidoCode: '11', sigunguCode: '11680', dongCode: '108', sidoName: '서울특별시', sigunguName: '강남구', dongName: '대치동',   lawdCd: '1168010800' },
  { sidoCode: '11', sigunguCode: '11680', dongCode: '109', sidoName: '서울특별시', sigunguName: '강남구', dongName: '압구정동', lawdCd: '1168010900' },
  { sidoCode: '11', sigunguCode: '11680', dongCode: '110', sidoName: '서울특별시', sigunguName: '강남구', dongName: '청담동',   lawdCd: '1168011000' },
  { sidoCode: '11', sigunguCode: '11680', dongCode: '111', sidoName: '서울특별시', sigunguName: '강남구', dongName: '논현동',   lawdCd: '1168011100' },
  { sidoCode: '11', sigunguCode: '11680', dongCode: '112', sidoName: '서울특별시', sigunguName: '강남구', dongName: '일원동',   lawdCd: '1168011200' },
  { sidoCode: '11', sigunguCode: '11680', dongCode: '113', sidoName: '서울특별시', sigunguName: '강남구', dongName: '수서동',   lawdCd: '1168011300' },
  // 서초구 (11650)
  { sidoCode: '11', sigunguCode: '11650', dongCode: '101', sidoName: '서울특별시', sigunguName: '서초구', dongName: '방배동',   lawdCd: '1165010100' },
  { sidoCode: '11', sigunguCode: '11650', dongCode: '102', sidoName: '서울특별시', sigunguName: '서초구', dongName: '양재동',   lawdCd: '1165010200' },
  { sidoCode: '11', sigunguCode: '11650', dongCode: '105', sidoName: '서울특별시', sigunguName: '서초구', dongName: '잠원동',   lawdCd: '1165010500' },
  { sidoCode: '11', sigunguCode: '11650', dongCode: '106', sidoName: '서울특별시', sigunguName: '서초구', dongName: '반포동',   lawdCd: '1165010600' },
  { sidoCode: '11', sigunguCode: '11650', dongCode: '107', sidoName: '서울특별시', sigunguName: '서초구', dongName: '서초동',   lawdCd: '1165010700' },
  // 송파구 (11710)
  { sidoCode: '11', sigunguCode: '11710', dongCode: '101', sidoName: '서울특별시', sigunguName: '송파구', dongName: '풍납동',   lawdCd: '1171010100' },
  { sidoCode: '11', sigunguCode: '11710', dongCode: '102', sidoName: '서울특별시', sigunguName: '송파구', dongName: '거여동',   lawdCd: '1171010200' },
  { sidoCode: '11', sigunguCode: '11710', dongCode: '103', sidoName: '서울특별시', sigunguName: '송파구', dongName: '마천동',   lawdCd: '1171010300' },
  { sidoCode: '11', sigunguCode: '11710', dongCode: '104', sidoName: '서울특별시', sigunguName: '송파구', dongName: '방이동',   lawdCd: '1171010400' },
  { sidoCode: '11', sigunguCode: '11710', dongCode: '105', sidoName: '서울특별시', sigunguName: '송파구', dongName: '오금동',   lawdCd: '1171010500' },
  { sidoCode: '11', sigunguCode: '11710', dongCode: '108', sidoName: '서울특별시', sigunguName: '송파구', dongName: '석촌동',   lawdCd: '1171010800' },
  { sidoCode: '11', sigunguCode: '11710', dongCode: '110', sidoName: '서울특별시', sigunguName: '송파구', dongName: '가락동',   lawdCd: '1171011000' },
  { sidoCode: '11', sigunguCode: '11710', dongCode: '111', sidoName: '서울특별시', sigunguName: '송파구', dongName: '문정동',   lawdCd: '1171011100' },
  { sidoCode: '11', sigunguCode: '11710', dongCode: '113', sidoName: '서울특별시', sigunguName: '송파구', dongName: '잠실동',   lawdCd: '1171011300' },
  { sidoCode: '11', sigunguCode: '11710', dongCode: '114', sidoName: '서울특별시', sigunguName: '송파구', dongName: '신천동',   lawdCd: '1171011400' },
  // 강동구 (11740)
  { sidoCode: '11', sigunguCode: '11740', dongCode: '101', sidoName: '서울특별시', sigunguName: '강동구', dongName: '천호동',   lawdCd: '1174010100' },
  { sidoCode: '11', sigunguCode: '11740', dongCode: '103', sidoName: '서울특별시', sigunguName: '강동구', dongName: '성내동',   lawdCd: '1174010300' },
  { sidoCode: '11', sigunguCode: '11740', dongCode: '104', sidoName: '서울특별시', sigunguName: '강동구', dongName: '암사동',   lawdCd: '1174010400' },
  { sidoCode: '11', sigunguCode: '11740', dongCode: '105', sidoName: '서울특별시', sigunguName: '강동구', dongName: '고덕동',   lawdCd: '1174010500' },
  { sidoCode: '11', sigunguCode: '11740', dongCode: '106', sidoName: '서울특별시', sigunguName: '강동구', dongName: '길동',     lawdCd: '1174010600' },
  { sidoCode: '11', sigunguCode: '11740', dongCode: '107', sidoName: '서울특별시', sigunguName: '강동구', dongName: '둔촌동',   lawdCd: '1174010700' },
  // 마포구 (11440)
  { sidoCode: '11', sigunguCode: '11440', dongCode: '101', sidoName: '서울특별시', sigunguName: '마포구', dongName: '아현동',   lawdCd: '1144010100' },
  { sidoCode: '11', sigunguCode: '11440', dongCode: '102', sidoName: '서울특별시', sigunguName: '마포구', dongName: '공덕동',   lawdCd: '1144010200' },
  { sidoCode: '11', sigunguCode: '11440', dongCode: '111', sidoName: '서울특별시', sigunguName: '마포구', dongName: '서교동',   lawdCd: '1144011100' },
  { sidoCode: '11', sigunguCode: '11440', dongCode: '113', sidoName: '서울특별시', sigunguName: '마포구', dongName: '합정동',   lawdCd: '1144011300' },
  { sidoCode: '11', sigunguCode: '11440', dongCode: '114', sidoName: '서울특별시', sigunguName: '마포구', dongName: '망원동',   lawdCd: '1144011400' },
  { sidoCode: '11', sigunguCode: '11440', dongCode: '115', sidoName: '서울특별시', sigunguName: '마포구', dongName: '연남동',   lawdCd: '1144011500' },
  { sidoCode: '11', sigunguCode: '11440', dongCode: '116', sidoName: '서울특별시', sigunguName: '마포구', dongName: '성산동',   lawdCd: '1144011600' },
  { sidoCode: '11', sigunguCode: '11440', dongCode: '118', sidoName: '서울특별시', sigunguName: '마포구', dongName: '상암동',   lawdCd: '1144011800' },
  // 용산구 (11170)
  { sidoCode: '11', sigunguCode: '11170', dongCode: '116', sidoName: '서울특별시', sigunguName: '용산구', dongName: '이촌동',   lawdCd: '1117011600' },
  { sidoCode: '11', sigunguCode: '11170', dongCode: '117', sidoName: '서울특별시', sigunguName: '용산구', dongName: '이태원동', lawdCd: '1117011700' },
  { sidoCode: '11', sigunguCode: '11170', dongCode: '118', sidoName: '서울특별시', sigunguName: '용산구', dongName: '한남동',   lawdCd: '1117011800' },
  { sidoCode: '11', sigunguCode: '11170', dongCode: '126', sidoName: '서울특별시', sigunguName: '용산구', dongName: '보광동',   lawdCd: '1117012600' },
  // 성동구 (11200)
  { sidoCode: '11', sigunguCode: '11200', dongCode: '101', sidoName: '서울특별시', sigunguName: '성동구', dongName: '성수동1가', lawdCd: '1120010100' },
  { sidoCode: '11', sigunguCode: '11200', dongCode: '102', sidoName: '서울특별시', sigunguName: '성동구', dongName: '성수동2가', lawdCd: '1120010200' },
  { sidoCode: '11', sigunguCode: '11200', dongCode: '103', sidoName: '서울특별시', sigunguName: '성동구', dongName: '금호동1가', lawdCd: '1120010300' },
  { sidoCode: '11', sigunguCode: '11200', dongCode: '107', sidoName: '서울특별시', sigunguName: '성동구', dongName: '행당동',   lawdCd: '1120010700' },
  // 광진구 (11215)
  { sidoCode: '11', sigunguCode: '11215', dongCode: '104', sidoName: '서울특별시', sigunguName: '광진구', dongName: '구의동',   lawdCd: '1121510400' },
  { sidoCode: '11', sigunguCode: '11215', dongCode: '105', sidoName: '서울특별시', sigunguName: '광진구', dongName: '광장동',   lawdCd: '1121510500' },
  { sidoCode: '11', sigunguCode: '11215', dongCode: '106', sidoName: '서울특별시', sigunguName: '광진구', dongName: '자양동',   lawdCd: '1121510600' },
  { sidoCode: '11', sigunguCode: '11215', dongCode: '107', sidoName: '서울특별시', sigunguName: '광진구', dongName: '화양동',   lawdCd: '1121510700' },
  // 동대문구 (11230)
  { sidoCode: '11', sigunguCode: '11230', dongCode: '104', sidoName: '서울특별시', sigunguName: '동대문구', dongName: '전농동',    lawdCd: '1123010400' },
  { sidoCode: '11', sigunguCode: '11230', dongCode: '105', sidoName: '서울특별시', sigunguName: '동대문구', dongName: '답십리동',  lawdCd: '1123010500' },
  { sidoCode: '11', sigunguCode: '11230', dongCode: '106', sidoName: '서울특별시', sigunguName: '동대문구', dongName: '장안동',    lawdCd: '1123010600' },
  { sidoCode: '11', sigunguCode: '11230', dongCode: '107', sidoName: '서울특별시', sigunguName: '동대문구', dongName: '청량리동',  lawdCd: '1123010700' },
  // 중랑구 (11260)
  { sidoCode: '11', sigunguCode: '11260', dongCode: '101', sidoName: '서울특별시', sigunguName: '중랑구', dongName: '면목동',   lawdCd: '1126010100' },
  { sidoCode: '11', sigunguCode: '11260', dongCode: '105', sidoName: '서울특별시', sigunguName: '중랑구', dongName: '상봉동',   lawdCd: '1126010500' },
  { sidoCode: '11', sigunguCode: '11260', dongCode: '106', sidoName: '서울특별시', sigunguName: '중랑구', dongName: '묵동',     lawdCd: '1126010600' },
  // 성북구 (11290)
  { sidoCode: '11', sigunguCode: '11290', dongCode: '115', sidoName: '서울특별시', sigunguName: '성북구', dongName: '돈암동',   lawdCd: '1129011500' },
  { sidoCode: '11', sigunguCode: '11290', dongCode: '128', sidoName: '서울특별시', sigunguName: '성북구', dongName: '정릉동',   lawdCd: '1129012800' },
  { sidoCode: '11', sigunguCode: '11290', dongCode: '129', sidoName: '서울특별시', sigunguName: '성북구', dongName: '길음동',   lawdCd: '1129012900' },
  { sidoCode: '11', sigunguCode: '11290', dongCode: '133', sidoName: '서울특별시', sigunguName: '성북구', dongName: '석관동',   lawdCd: '1129013300' },
  // 강북구 (11305)
  { sidoCode: '11', sigunguCode: '11305', dongCode: '101', sidoName: '서울특별시', sigunguName: '강북구', dongName: '번동',     lawdCd: '1130510100' },
  { sidoCode: '11', sigunguCode: '11305', dongCode: '103', sidoName: '서울특별시', sigunguName: '강북구', dongName: '수유동',   lawdCd: '1130510300' },
  { sidoCode: '11', sigunguCode: '11305', dongCode: '106', sidoName: '서울특별시', sigunguName: '강북구', dongName: '미아동',   lawdCd: '1130510600' },
  // 도봉구 (11320)
  { sidoCode: '11', sigunguCode: '11320', dongCode: '101', sidoName: '서울특별시', sigunguName: '도봉구', dongName: '쌍문동',   lawdCd: '1132010100' },
  { sidoCode: '11', sigunguCode: '11320', dongCode: '102', sidoName: '서울특별시', sigunguName: '도봉구', dongName: '방학동',   lawdCd: '1132010200' },
  { sidoCode: '11', sigunguCode: '11320', dongCode: '103', sidoName: '서울특별시', sigunguName: '도봉구', dongName: '창동',     lawdCd: '1132010300' },
  // 노원구 (11350)
  { sidoCode: '11', sigunguCode: '11350', dongCode: '101', sidoName: '서울특별시', sigunguName: '노원구', dongName: '월계동',   lawdCd: '1135010100' },
  { sidoCode: '11', sigunguCode: '11350', dongCode: '102', sidoName: '서울특별시', sigunguName: '노원구', dongName: '공릉동',   lawdCd: '1135010200' },
  { sidoCode: '11', sigunguCode: '11350', dongCode: '103', sidoName: '서울특별시', sigunguName: '노원구', dongName: '하계동',   lawdCd: '1135010300' },
  { sidoCode: '11', sigunguCode: '11350', dongCode: '104', sidoName: '서울특별시', sigunguName: '노원구', dongName: '중계동',   lawdCd: '1135010400' },
  { sidoCode: '11', sigunguCode: '11350', dongCode: '105', sidoName: '서울특별시', sigunguName: '노원구', dongName: '상계동',   lawdCd: '1135010500' },
  // 은평구 (11380)
  { sidoCode: '11', sigunguCode: '11380', dongCode: '103', sidoName: '서울특별시', sigunguName: '은평구', dongName: '불광동',   lawdCd: '1138010300' },
  { sidoCode: '11', sigunguCode: '11380', dongCode: '104', sidoName: '서울특별시', sigunguName: '은평구', dongName: '갈현동',   lawdCd: '1138010400' },
  { sidoCode: '11', sigunguCode: '11380', dongCode: '107', sidoName: '서울특별시', sigunguName: '은평구', dongName: '응암동',   lawdCd: '1138010700' },
  // 서대문구 (11410)
  { sidoCode: '11', sigunguCode: '11410', dongCode: '104', sidoName: '서울특별시', sigunguName: '서대문구', dongName: '홍제동',   lawdCd: '1141010400' },
  { sidoCode: '11', sigunguCode: '11410', dongCode: '108', sidoName: '서울특별시', sigunguName: '서대문구', dongName: '홍은동',   lawdCd: '1141010800' },
  { sidoCode: '11', sigunguCode: '11410', dongCode: '109', sidoName: '서울특별시', sigunguName: '서대문구', dongName: '북가좌동', lawdCd: '1141010900' },
  { sidoCode: '11', sigunguCode: '11410', dongCode: '110', sidoName: '서울특별시', sigunguName: '서대문구', dongName: '남가좌동', lawdCd: '1141011000' },
  // 종로구 (11110)
  { sidoCode: '11', sigunguCode: '11110', dongCode: '138', sidoName: '서울특별시', sigunguName: '종로구', dongName: '삼청동',   lawdCd: '1111013800' },
  { sidoCode: '11', sigunguCode: '11110', dongCode: '170', sidoName: '서울특별시', sigunguName: '종로구', dongName: '평창동',   lawdCd: '1111017000' },
  { sidoCode: '11', sigunguCode: '11110', dongCode: '171', sidoName: '서울특별시', sigunguName: '종로구', dongName: '부암동',   lawdCd: '1111017100' },
  // 영등포구 (11560)
  { sidoCode: '11', sigunguCode: '11560', dongCode: '110', sidoName: '서울특별시', sigunguName: '영등포구', dongName: '여의도동', lawdCd: '1156011000' },
  { sidoCode: '11', sigunguCode: '11560', dongCode: '130', sidoName: '서울특별시', sigunguName: '영등포구', dongName: '신길동',   lawdCd: '1156013000' },
  { sidoCode: '11', sigunguCode: '11560', dongCode: '131', sidoName: '서울특별시', sigunguName: '영등포구', dongName: '대림동',   lawdCd: '1156013100' },
  // 동작구 (11590)
  { sidoCode: '11', sigunguCode: '11590', dongCode: '101', sidoName: '서울특별시', sigunguName: '동작구', dongName: '노량진동', lawdCd: '1159010100' },
  { sidoCode: '11', sigunguCode: '11590', dongCode: '103', sidoName: '서울특별시', sigunguName: '동작구', dongName: '흑석동',   lawdCd: '1159010300' },
  { sidoCode: '11', sigunguCode: '11590', dongCode: '106', sidoName: '서울특별시', sigunguName: '동작구', dongName: '사당동',   lawdCd: '1159010600' },
  // 관악구 (11620)
  { sidoCode: '11', sigunguCode: '11620', dongCode: '101', sidoName: '서울특별시', sigunguName: '관악구', dongName: '신림동',   lawdCd: '1162010100' },
  { sidoCode: '11', sigunguCode: '11620', dongCode: '103', sidoName: '서울특별시', sigunguName: '관악구', dongName: '봉천동',   lawdCd: '1162010300' },
  // 구로구 (11530)
  { sidoCode: '11', sigunguCode: '11530', dongCode: '101', sidoName: '서울특별시', sigunguName: '구로구', dongName: '구로동',   lawdCd: '1153010100' },
  { sidoCode: '11', sigunguCode: '11530', dongCode: '103', sidoName: '서울특별시', sigunguName: '구로구', dongName: '신도림동', lawdCd: '1153010300' },
  { sidoCode: '11', sigunguCode: '11530', dongCode: '104', sidoName: '서울특별시', sigunguName: '구로구', dongName: '개봉동',   lawdCd: '1153010400' },
  // 금천구 (11545)
  { sidoCode: '11', sigunguCode: '11545', dongCode: '101', sidoName: '서울특별시', sigunguName: '금천구', dongName: '가산동',   lawdCd: '1154510100' },
  { sidoCode: '11', sigunguCode: '11545', dongCode: '102', sidoName: '서울특별시', sigunguName: '금천구', dongName: '독산동',   lawdCd: '1154510200' },
  // 양천구 (11470)
  { sidoCode: '11', sigunguCode: '11470', dongCode: '101', sidoName: '서울특별시', sigunguName: '양천구', dongName: '목동',     lawdCd: '1147010100' },
  { sidoCode: '11', sigunguCode: '11470', dongCode: '103', sidoName: '서울특별시', sigunguName: '양천구', dongName: '신월동',   lawdCd: '1147010300' },
  { sidoCode: '11', sigunguCode: '11470', dongCode: '104', sidoName: '서울특별시', sigunguName: '양천구', dongName: '신정동',   lawdCd: '1147010400' },
  // 강서구 (11500)
  { sidoCode: '11', sigunguCode: '11500', dongCode: '102', sidoName: '서울특별시', sigunguName: '강서구', dongName: '화곡동',   lawdCd: '1150010200' },
  { sidoCode: '11', sigunguCode: '11500', dongCode: '103', sidoName: '서울특별시', sigunguName: '강서구', dongName: '가양동',   lawdCd: '1150010300' },
  { sidoCode: '11', sigunguCode: '11500', dongCode: '105', sidoName: '서울특별시', sigunguName: '강서구', dongName: '마곡동',   lawdCd: '1150010500' },

  // ========== 인천광역시 ==========
  // 남동구 (28200)
  { sidoCode: '28', sigunguCode: '28200', dongCode: '101', sidoName: '인천광역시', sigunguName: '남동구', dongName: '구월동',   lawdCd: '2820010100' },
  { sidoCode: '28', sigunguCode: '28200', dongCode: '102', sidoName: '인천광역시', sigunguName: '남동구', dongName: '간석동',   lawdCd: '2820010200' },
  { sidoCode: '28', sigunguCode: '28200', dongCode: '109', sidoName: '인천광역시', sigunguName: '남동구', dongName: '논현동',   lawdCd: '2820010900' },
  // 부평구 (28237)
  { sidoCode: '28', sigunguCode: '28237', dongCode: '101', sidoName: '인천광역시', sigunguName: '부평구', dongName: '부평동',   lawdCd: '2823710100' },
  { sidoCode: '28', sigunguCode: '28237', dongCode: '104', sidoName: '인천광역시', sigunguName: '부평구', dongName: '갈산동',   lawdCd: '2823710400' },
  { sidoCode: '28', sigunguCode: '28237', dongCode: '105', sidoName: '인천광역시', sigunguName: '부평구', dongName: '삼산동',   lawdCd: '2823710500' },
  // 연수구 (28185)
  { sidoCode: '28', sigunguCode: '28185', dongCode: '101', sidoName: '인천광역시', sigunguName: '연수구', dongName: '옥련동',   lawdCd: '2818510100' },
  { sidoCode: '28', sigunguCode: '28185', dongCode: '104', sidoName: '인천광역시', sigunguName: '연수구', dongName: '송도동',   lawdCd: '2818510400' },
  { sidoCode: '28', sigunguCode: '28185', dongCode: '105', sidoName: '인천광역시', sigunguName: '연수구', dongName: '연수동',   lawdCd: '2818510500' },
  // 미추홀구 (28177)
  { sidoCode: '28', sigunguCode: '28177', dongCode: '101', sidoName: '인천광역시', sigunguName: '미추홀구', dongName: '주안동', lawdCd: '2817710100' },
  { sidoCode: '28', sigunguCode: '28177', dongCode: '102', sidoName: '인천광역시', sigunguName: '미추홀구', dongName: '숭의동', lawdCd: '2817710200' },
  // 서구 (28260)
  { sidoCode: '28', sigunguCode: '28260', dongCode: '101', sidoName: '인천광역시', sigunguName: '서구', dongName: '가좌동',     lawdCd: '2826010100' },
  { sidoCode: '28', sigunguCode: '28260', dongCode: '102', sidoName: '인천광역시', sigunguName: '서구', dongName: '신현동',     lawdCd: '2826010200' },
  { sidoCode: '28', sigunguCode: '28260', dongCode: '110', sidoName: '인천광역시', sigunguName: '서구', dongName: '검단동',     lawdCd: '2826011000' },
  // 계양구 (28245)
  { sidoCode: '28', sigunguCode: '28245', dongCode: '101', sidoName: '인천광역시', sigunguName: '계양구', dongName: '계산동',   lawdCd: '2824510100' },
  { sidoCode: '28', sigunguCode: '28245', dongCode: '104', sidoName: '인천광역시', sigunguName: '계양구', dongName: '작전동',   lawdCd: '2824510400' },

  // ========== 경기도 ==========
  // 수원시 장안구 (41111)
  { sidoCode: '41', sigunguCode: '41111', dongCode: '101', sidoName: '경기도', sigunguName: '수원시 장안구', dongName: '영화동', lawdCd: '4111110100' },
  { sidoCode: '41', sigunguCode: '41111', dongCode: '102', sidoName: '경기도', sigunguName: '수원시 장안구', dongName: '조원동', lawdCd: '4111110200' },
  // 수원시 권선구 (41113)
  { sidoCode: '41', sigunguCode: '41113', dongCode: '109', sidoName: '경기도', sigunguName: '수원시 권선구', dongName: '권선동', lawdCd: '4111310900' },
  // 수원시 팔달구 (41115)
  { sidoCode: '41', sigunguCode: '41115', dongCode: '101', sidoName: '경기도', sigunguName: '수원시 팔달구', dongName: '인계동', lawdCd: '4111510100' },
  // 수원시 영통구 (41117)
  { sidoCode: '41', sigunguCode: '41117', dongCode: '101', sidoName: '경기도', sigunguName: '수원시 영통구', dongName: '영통동', lawdCd: '4111710100' },
  { sidoCode: '41', sigunguCode: '41117', dongCode: '104', sidoName: '경기도', sigunguName: '수원시 영통구', dongName: '광교동', lawdCd: '4111710400' },
  // 성남시 분당구 (41135)
  { sidoCode: '41', sigunguCode: '41135', dongCode: '101', sidoName: '경기도', sigunguName: '성남시 분당구', dongName: '야탑동', lawdCd: '4113510100' },
  { sidoCode: '41', sigunguCode: '41135', dongCode: '102', sidoName: '경기도', sigunguName: '성남시 분당구', dongName: '이매동', lawdCd: '4113510200' },
  { sidoCode: '41', sigunguCode: '41135', dongCode: '103', sidoName: '경기도', sigunguName: '성남시 분당구', dongName: '서현동', lawdCd: '4113510300' },
  { sidoCode: '41', sigunguCode: '41135', dongCode: '105', sidoName: '경기도', sigunguName: '성남시 분당구', dongName: '정자동', lawdCd: '4113510500' },
  { sidoCode: '41', sigunguCode: '41135', dongCode: '107', sidoName: '경기도', sigunguName: '성남시 분당구', dongName: '판교동', lawdCd: '4113510700' },
  // 성남시 수정구 (41131)
  { sidoCode: '41', sigunguCode: '41131', dongCode: '101', sidoName: '경기도', sigunguName: '성남시 수정구', dongName: '수진동', lawdCd: '4113110100' },
  { sidoCode: '41', sigunguCode: '41131', dongCode: '103', sidoName: '경기도', sigunguName: '성남시 수정구', dongName: '신흥동', lawdCd: '4113110300' },
  // 고양시 일산동구 (41285)
  { sidoCode: '41', sigunguCode: '41285', dongCode: '101', sidoName: '경기도', sigunguName: '고양시 일산동구', dongName: '마두동', lawdCd: '4128510100' },
  { sidoCode: '41', sigunguCode: '41285', dongCode: '102', sidoName: '경기도', sigunguName: '고양시 일산동구', dongName: '백석동', lawdCd: '4128510200' },
  // 고양시 일산서구 (41287)
  { sidoCode: '41', sigunguCode: '41287', dongCode: '101', sidoName: '경기도', sigunguName: '고양시 일산서구', dongName: '주엽동', lawdCd: '4128710100' },
  { sidoCode: '41', sigunguCode: '41287', dongCode: '102', sidoName: '경기도', sigunguName: '고양시 일산서구', dongName: '대화동', lawdCd: '4128710200' },
  // 고양시 덕양구 (41281)
  { sidoCode: '41', sigunguCode: '41281', dongCode: '101', sidoName: '경기도', sigunguName: '고양시 덕양구', dongName: '행신동', lawdCd: '4128110100' },
  { sidoCode: '41', sigunguCode: '41281', dongCode: '112', sidoName: '경기도', sigunguName: '고양시 덕양구', dongName: '화정동', lawdCd: '4128111200' },
  // 용인시 수지구 (41465)
  { sidoCode: '41', sigunguCode: '41465', dongCode: '101', sidoName: '경기도', sigunguName: '용인시 수지구', dongName: '풍덕천동', lawdCd: '4146510100' },
  { sidoCode: '41', sigunguCode: '41465', dongCode: '103', sidoName: '경기도', sigunguName: '용인시 수지구', dongName: '동천동', lawdCd: '4146510300' },
  // 용인시 기흥구 (41463)
  { sidoCode: '41', sigunguCode: '41463', dongCode: '101', sidoName: '경기도', sigunguName: '용인시 기흥구', dongName: '기흥동',   lawdCd: '4146310100' },
  { sidoCode: '41', sigunguCode: '41463', dongCode: '110', sidoName: '경기도', sigunguName: '용인시 기흥구', dongName: '동백동',   lawdCd: '4146311000' },
  // 부천시 (41190)
  { sidoCode: '41', sigunguCode: '41190', dongCode: '101', sidoName: '경기도', sigunguName: '부천시', dongName: '심곡동',  lawdCd: '4119010100' },
  { sidoCode: '41', sigunguCode: '41190', dongCode: '102', sidoName: '경기도', sigunguName: '부천시', dongName: '원미동',  lawdCd: '4119010200' },
  { sidoCode: '41', sigunguCode: '41190', dongCode: '111', sidoName: '경기도', sigunguName: '부천시', dongName: '상동',    lawdCd: '4119011100' },
  // 안양시 만안구 (41171)
  { sidoCode: '41', sigunguCode: '41171', dongCode: '101', sidoName: '경기도', sigunguName: '안양시 만안구', dongName: '안양동',   lawdCd: '4117110100' },
  // 안양시 동안구 (41173)
  { sidoCode: '41', sigunguCode: '41173', dongCode: '101', sidoName: '경기도', sigunguName: '안양시 동안구', dongName: '평촌동',   lawdCd: '4117310100' },
  { sidoCode: '41', sigunguCode: '41173', dongCode: '102', sidoName: '경기도', sigunguName: '안양시 동안구', dongName: '비산동',   lawdCd: '4117310200' },
  // 남양주시 (41360)
  { sidoCode: '41', sigunguCode: '41360', dongCode: '101', sidoName: '경기도', sigunguName: '남양주시', dongName: '금곡동', lawdCd: '4136010100' },
  { sidoCode: '41', sigunguCode: '41360', dongCode: '102', sidoName: '경기도', sigunguName: '남양주시', dongName: '호평동', lawdCd: '4136010200' },
  { sidoCode: '41', sigunguCode: '41360', dongCode: '103', sidoName: '경기도', sigunguName: '남양주시', dongName: '다산동', lawdCd: '4136010300' },
  // 하남시 (41450)
  { sidoCode: '41', sigunguCode: '41450', dongCode: '101', sidoName: '경기도', sigunguName: '하남시', dongName: '신장동', lawdCd: '4145010100' },
  { sidoCode: '41', sigunguCode: '41450', dongCode: '103', sidoName: '경기도', sigunguName: '하남시', dongName: '미사동', lawdCd: '4145010300' },
  // 화성시 (41590)
  { sidoCode: '41', sigunguCode: '41590', dongCode: '101', sidoName: '경기도', sigunguName: '화성시', dongName: '병점동', lawdCd: '4159010100' },
  { sidoCode: '41', sigunguCode: '41590', dongCode: '103', sidoName: '경기도', sigunguName: '화성시', dongName: '동탄동', lawdCd: '4159010300' },
  // 의정부시 (41150)
  { sidoCode: '41', sigunguCode: '41150', dongCode: '101', sidoName: '경기도', sigunguName: '의정부시', dongName: '의정부동', lawdCd: '4115010100' },
  { sidoCode: '41', sigunguCode: '41150', dongCode: '102', sidoName: '경기도', sigunguName: '의정부시', dongName: '가능동',  lawdCd: '4115010200' },
  // 평택시 (41220)
  { sidoCode: '41', sigunguCode: '41220', dongCode: '101', sidoName: '경기도', sigunguName: '평택시', dongName: '평택동', lawdCd: '4122010100' },
  { sidoCode: '41', sigunguCode: '41220', dongCode: '110', sidoName: '경기도', sigunguName: '평택시', dongName: '고덕동', lawdCd: '4122011000' },
  // 광명시 (41210)
  { sidoCode: '41', sigunguCode: '41210', dongCode: '101', sidoName: '경기도', sigunguName: '광명시', dongName: '광명동', lawdCd: '4121010100' },
  { sidoCode: '41', sigunguCode: '41210', dongCode: '102', sidoName: '경기도', sigunguName: '광명시', dongName: '철산동', lawdCd: '4121010200' },
  // 시흥시 (41390)
  { sidoCode: '41', sigunguCode: '41390', dongCode: '101', sidoName: '경기도', sigunguName: '시흥시', dongName: '신천동', lawdCd: '4139010100' },
  { sidoCode: '41', sigunguCode: '41390', dongCode: '104', sidoName: '경기도', sigunguName: '시흥시', dongName: '정왕동', lawdCd: '4139010400' },
  // 파주시 (41480)
  { sidoCode: '41', sigunguCode: '41480', dongCode: '101', sidoName: '경기도', sigunguName: '파주시', dongName: '금촌동', lawdCd: '4148010100' },
  { sidoCode: '41', sigunguCode: '41480', dongCode: '106', sidoName: '경기도', sigunguName: '파주시', dongName: '운정동', lawdCd: '4148010600' },
  // 김포시 (41570)
  { sidoCode: '41', sigunguCode: '41570', dongCode: '101', sidoName: '경기도', sigunguName: '김포시', dongName: '사우동', lawdCd: '4157010100' },
  { sidoCode: '41', sigunguCode: '41570', dongCode: '104', sidoName: '경기도', sigunguName: '김포시', dongName: '장기동', lawdCd: '4157010400' },

  // ========== 부산광역시 ==========
  // 해운대구 (26350)
  { sidoCode: '26', sigunguCode: '26350', dongCode: '101', sidoName: '부산광역시', sigunguName: '해운대구', dongName: '우동',   lawdCd: '2635010100' },
  { sidoCode: '26', sigunguCode: '26350', dongCode: '102', sidoName: '부산광역시', sigunguName: '해운대구', dongName: '중동',   lawdCd: '2635010200' },
  { sidoCode: '26', sigunguCode: '26350', dongCode: '103', sidoName: '부산광역시', sigunguName: '해운대구', dongName: '좌동',   lawdCd: '2635010300' },
  // 수영구 (26380)
  { sidoCode: '26', sigunguCode: '26380', dongCode: '101', sidoName: '부산광역시', sigunguName: '수영구', dongName: '남천동',   lawdCd: '2638010100' },
  { sidoCode: '26', sigunguCode: '26380', dongCode: '102', sidoName: '부산광역시', sigunguName: '수영구', dongName: '민락동',   lawdCd: '2638010200' },
  // 연제구 (26410)
  { sidoCode: '26', sigunguCode: '26410', dongCode: '101', sidoName: '부산광역시', sigunguName: '연제구', dongName: '연산동',   lawdCd: '2641010100' },
  // 동래구 (26260)
  { sidoCode: '26', sigunguCode: '26260', dongCode: '101', sidoName: '부산광역시', sigunguName: '동래구', dongName: '명륜동',   lawdCd: '2626010100' },
  { sidoCode: '26', sigunguCode: '26260', dongCode: '102', sidoName: '부산광역시', sigunguName: '동래구', dongName: '온천동',   lawdCd: '2626010200' },

  // ========== 대구광역시 ==========
  // 수성구 (27260)
  { sidoCode: '27', sigunguCode: '27260', dongCode: '101', sidoName: '대구광역시', sigunguName: '수성구', dongName: '범어동',   lawdCd: '2726010100' },
  { sidoCode: '27', sigunguCode: '27260', dongCode: '102', sidoName: '대구광역시', sigunguName: '수성구', dongName: '만촌동',   lawdCd: '2726010200' },
  { sidoCode: '27', sigunguCode: '27260', dongCode: '103', sidoName: '대구광역시', sigunguName: '수성구', dongName: '수성동',   lawdCd: '2726010300' },
  // 달서구 (27290)
  { sidoCode: '27', sigunguCode: '27290', dongCode: '101', sidoName: '대구광역시', sigunguName: '달서구', dongName: '월성동',   lawdCd: '2729010100' },
  { sidoCode: '27', sigunguCode: '27290', dongCode: '103', sidoName: '대구광역시', sigunguName: '달서구', dongName: '감삼동',   lawdCd: '2729010300' },
];

async function main() {
  console.log(`Seeding ${regions.length} regions...`);

  for (const region of regions) {
    await prisma.region.upsert({
      where: { lawdCd: region.lawdCd },
      update: {
        sidoCode: region.sidoCode,
        sigunguCode: region.sigunguCode,
        dongCode: region.dongCode,
        sidoName: region.sidoName,
        sigunguName: region.sigunguName,
        dongName: region.dongName,
      },
      create: region,
    });
  }

  console.log(`✅ Seeding complete: ${regions.length} regions inserted/updated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
