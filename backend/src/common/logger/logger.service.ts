import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  log(context: string, message: string) {
    console.log(`[${context}] ${message}`);
  }

  error(context: string, message: string, trace?: string) {
    console.error(`[${context}] ${message}`, trace);
  }

  debug(context: string, message: string) {
    console.debug(`[${context}] ${message}`);
  }

  warn(context: string, message: string) {
    console.warn(`[${context}] ${message}`);
  }
}
