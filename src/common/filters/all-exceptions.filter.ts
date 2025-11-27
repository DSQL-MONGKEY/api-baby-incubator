import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter<T> implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: T, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Internal server error';

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const res = exception.getResponse();

			if (typeof res === 'string') {
			message = res;
			} else if (typeof res === 'object' && res !== null) {
			if (Array.isArray((res as any).message)) {
				message = (res as any).message.join(', ');
			} else {
				message =
					(res as any).message || (res as any).error || JSON.stringify(res);
			}
			}
		}

		this.logger.error(
			`HTTP Status: ${status}, Error Message: ${message}`,
			(exception as any).stack,
		);

		response.status(status).json({
			success: false,
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			error: {
				message,
			},
		});
	}
}
