import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  // Self-ping every 8 minutes to prevent Render free tier sleep (sleeps after 15 min)
  @Cron('0 */8 * * * *')
  async keepAlive() {
    const host = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3001}`;
    const url = `${host}/api/v1/health`;
    try {
      await fetch(url, { signal: AbortSignal.timeout(5000) });
      this.logger.log(`Keep-alive ping sent to ${url}`);
    } catch {
      // Silently ignore — expected on non-Render environments
    }
  }
}
