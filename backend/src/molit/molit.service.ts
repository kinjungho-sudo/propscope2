import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as xml2js from 'xml2js';

const MOLIT_BASE_URL = 'http://apis.data.go.kr/1613000';

export interface MolitTransactionRaw {
  건물명?: string;
  년?: string;
  월?: string;
  일?: string;
  거래금액?: string;
  전용면적?: string;
  층?: string;
  건축년도?: string;
  법정동?: string;
  지번?: string;
}

@Injectable()
export class MolitService {
  private readonly logger = new Logger(MolitService.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('MOLIT_API_KEY') || '';
  }

  async fetchVillaTransactions(lawdCd: string, dealYmd: string): Promise<MolitTransactionRaw[]> {
    return this.fetchFromMolit('RHTrade/getRTMSDataSvcRHTrade', lawdCd, dealYmd);
  }

  async fetchOfficetelTransactions(lawdCd: string, dealYmd: string): Promise<MolitTransactionRaw[]> {
    return this.fetchFromMolit('OffiTrade/getRTMSDataSvcOffiTrade', lawdCd, dealYmd);
  }

  private async fetchFromMolit(
    endpoint: string,
    lawdCd: string,
    dealYmd: string,
  ): Promise<MolitTransactionRaw[]> {
    try {
      // serviceKey를 params로 넘기면 axios가 이중 인코딩함 → 직접 쿼리스트링에 붙임
      const qs = new URLSearchParams({
        LAWD_CD: lawdCd,
        DEAL_YMD: dealYmd,
        numOfRows: '1000',
        pageNo: '1',
      }).toString();
      const url = `${MOLIT_BASE_URL}/${endpoint}?serviceKey=${this.apiKey}&${qs}`;
      const response = await axios.get<string>(url, { timeout: 10000 });

      const parsed = await xml2js.parseStringPromise(response.data, { explicitArray: false });
      const items = parsed?.response?.body?.items?.item;
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
