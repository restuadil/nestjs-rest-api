import { Meta } from "src/types/web.type";

export function generateMeta(page: number, limit: number, total: number): Meta {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const nextPage = hasNext ? page + 1 : undefined;
  const prevPage = hasPrev ? page - 1 : undefined;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
  };
}
