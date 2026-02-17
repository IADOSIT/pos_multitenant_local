import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantScope = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const scope = request.tenantScope || request.user;
    return data ? scope?.[data] : scope;
  },
);
