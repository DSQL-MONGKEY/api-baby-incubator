import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const IncubatorId = createParamDecorator((_: unknown, ctx: ExecutionContext) =>
   ctx.switchToHttp().getRequest().params.id as string,
);
