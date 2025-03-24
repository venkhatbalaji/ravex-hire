import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const isHttp = host.getType() === 'http';
    const response = isHttp ? host.switchToHttp().getResponse() : null;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Unexpected server error';
    let code: string | number = 'INTERNAL_ERROR';
    Logger.error(`[ExceptionFilter] ${JSON.stringify(exception)}`);
    try {
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const res = exception.getResponse();
        message =
          typeof res === 'object' && res['message']
            ? res['message']
            : exception.message;
        code = (res as any)?.code || code;
      } else if (typeof exception === 'object' && exception?.message) {
        try {
          const parsed = JSON.parse(exception?.details);
          message = parsed.message || message;
          code = parsed.code ? this.mapCodeToHttpStatus(code) : code;
        } catch {
          message = exception.message;
        }
      }
      status = this.mapCodeToHttpStatus(code);
      if (response && response.status) {
        response.status(status).json({ success: false, message, code });
      }
    } catch (fallback) {
      Logger.error('Fallback error in ExceptionFilter', fallback);
      if (response && response.status) {
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Something went wrong',
          code: 'UNHANDLED_EXCEPTION',
        });
      }
    }
  }

  private mapCodeToHttpStatus(code: string | number): number {
    switch (code) {
      case '23505':
        return HttpStatus.CONFLICT;
      case 'NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'VALIDATION_FAILED':
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
