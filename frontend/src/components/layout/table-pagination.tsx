"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TablePaginationProps {
  totalItems: number
  pageSize: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  resultsLabel?: string
  perPageLabel?: string
}

export function TablePagination({
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 50, 100],
  resultsLabel,
  perPageLabel,
}: TablePaginationProps) {
  if (totalItems === 0) return null

  return (
    <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        {resultsLabel && <span>{totalItems} {resultsLabel}</span>}
        {resultsLabel && perPageLabel && <span className="text-muted-foreground/50">|</span>}
        {perPageLabel && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{perPageLabel}</span>
            {pageSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onPageSizeChange(size)}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-mono tabular-nums transition-colors",
                  pageSize === size
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-2 font-mono text-[11px] tabular-nums text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          size="icon-xs"
          variant="outline"
          className="h-7 w-7"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <Button
          size="icon-xs"
          variant="outline"
          className="h-7 w-7"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

/**
 * 分页计算 hook 辅助函数
 */
export function usePaginationParams(items: unknown[], pageSize: number, currentPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * pageSize
  const paginatedItems = items.slice(start, start + pageSize)
  return { totalPages, safePage, paginatedItems }
}
