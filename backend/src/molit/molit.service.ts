import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as xml2js from 'xml2js';

const MOLIT_BASE_URL = 'https://apis.data.go.kr/1613000';

// 빌라/오피스텔 모두 영문 필드 반환 (건물명만 다름: mhouseNm vs offiNm)
export interface MolitTransactionRaw {
  mhouseNm?: string;   // 빌라 건물명
  offiNm?: string;     // 오피스텔 건물명
  dealYear?: string;
  dealMonth?: string;
  dealDay?: string;
  dealAmount?: string;
  excluUseAr?: string; // 전용면적
  floor?: string;
  buildYear?: string;
  umdNm?: string;      // 법정동
  jibun?: string;
}

@Injectable()
export class MolitService {
  private readonly logger = new Logger(MolitService.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('MOLIT_API_KEY') || '';
  }

  async fetchVillaTransactions(lawdCd: string, dealYmd: string): Promise<MolitTransactionRaw[]> {
    return this.fetchFromMolit('RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade', lawdCd, dealYmd);
  }

  async fetchOfficetelTransactions(lawdCd: string, dealYmd: string): Promise<MolitTransactionRaw[]> {
    return this.fetchFromMolit('RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade', lawdCd, dealYmd);
  }

  private async fetchFromMolit(
    endpoint: string,
    lawdCd: string,
    dealYmd: string,
  ): Promise<MolitTransactionRaw[]> {
    try {
      // serviceKey를 params로 넘기면 axios가 이중 인코딩함 → 직접 쿼리스트링에 붙임
      // encodeURIComponent: 디코딩된 원본 키의 +/= 등 특수문자를 안전하게 처리
      const qs = new URLSearchParams({
        LAWD_CD: lawdCd,
        DEAL_YMD: dealYmd,
        numOfRows: '1000',
        pageNo: '1',
      }).toString();
      const url = `${MOLIT_BASE_URL}/${endpoint}?serviceKey=${encodeURIComponent(this.apiKey)}&${qs}`;
      const response = await axios.get<any>(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      // API가 JSON 또는 XML 반환 — JSON 우선 처리
      const data: any = response.data;
      let items: any;
      if (data && typeof data === 'object') {
        // axios가 이미 JSON으로 파싱한 경우
        items = data?.response?.body?.items?.item;
      } else if (typeof data === 'string' && data.trimStart().startsWith('{')) {
        // 문자열 JSON인 경우
        const parsed = JSON.parse(data);
        items = parsed?.response?.body?.items?.item;
      } else {
        // XML인 경우
        const parsed = await xml2js.parseStringPromise(data, { explicitArray: false });
        items = parsed?.response?.body?.items?.item;
      }
      if (!items) return [];
      return Array.isArray(items) ? items : [items];
    } catch (error) {
      this.logger.error(`MOLIT API 호출 실패: ${endpoint}`, (error as Error).message);
      return [];
    }
  }

  parseDealAmount(amountStr: string): number {
    return parseInt(amountStr.replace(/,/g, '').trim(), 10) || 0;
  }

  calcPricePerPyeong(dealAmount: number, exclusiveArea: number): number {
    if (exclusiveArea <= 0) return 0;
    return Math.round(dealAmount / (exclusiveArea / 3.3058));
  }
}
