import { Request } from 'express';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationOptions = (req: Request): PaginationOptions => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip
  };
};

export const formatPaginatedResponse = (data: any[], total: number, options: PaginationOptions) => {
  const totalPages = Math.ceil(total / options.limit);
  return {
    data,
    meta: {
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1
    }
  };
};
