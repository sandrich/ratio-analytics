/**
 * Token Data Table Component
 * 
 * Creates data table component using shadcn/ui Table components with:
 * - Column definitions for tokens, ratios, and timeframes
 * - Sorting functionality by average performance score
 * - Color-coded performance visualization
 */

import React, { useMemo, useState } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { TokenDataTableProps, TokenData } from '../types';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  getPerformanceColor,
  getContrastTextColor,
  generateColorScale,
  getPerformanceCategory
} from '../utils/colorCoding';

// Format ratio values for display
const formatRatio = (value: number): string => {
  if (!isFinite(value)) return 'N/A';
  if (Math.abs(value) < 0.001) return '0.000';
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 100) return value.toFixed(1);
  if (Math.abs(value) >= 10) return value.toFixed(2);
  return value.toFixed(3);
};

export const TokenDataTable: React.FC<TokenDataTableProps> = ({
  tokens,
  timeframes,
  onTokenSelectionChange: _onTokenSelectionChange,
  sortBy: _sortBy
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'overallAverageScore', desc: true } // Default sort by overall average score descending
  ]);

  // Create column definitions
  const columns = useMemo<ColumnDef<TokenData>[]>(() => {
    const baseColumns: ColumnDef<TokenData>[] = [
      // Token Info Column
      {
        id: 'token',
        header: 'Token',
        cell: ({ row }) => {
          const token = row.original;
          return (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-card-foreground uppercase">
                  {token.symbol}
                </span>
              </div>
            </div>
          );
        },
        enableSorting: false,
      },

      // Average Omega Score Column
      {
        accessorKey: 'averageOmegaScore',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold text-xs"
            >
              Avg Ω
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-1 h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-1 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-1 h-3 w-3" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const score = row.original.averageOmegaScore;
          const backgroundColor = getPerformanceColor(score);
          const textColor = getContrastTextColor(score);
          const category = getPerformanceCategory(score);

          return (
            <div
              className="text-center font-medium px-2 py-1 rounded border border-border text-xs"
              style={{
                backgroundColor,
                color: textColor
              }}
              title={`Avg Omega: ${category}`}
            >
              {formatRatio(score)}
            </div>
          );
        },
      },

      // Average Sharpe Score Column
      {
        accessorKey: 'averageSharpeScore',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold text-xs"
            >
              Avg S
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-1 h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-1 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-1 h-3 w-3" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const score = row.original.averageSharpeScore;
          const backgroundColor = getPerformanceColor(score);
          const textColor = getContrastTextColor(score);
          const category = getPerformanceCategory(score);

          return (
            <div
              className="text-center font-medium px-2 py-1 rounded border border-border text-xs"
              style={{
                backgroundColor,
                color: textColor
              }}
              title={`Avg Sharpe: ${category}`}
            >
              {formatRatio(score)}
            </div>
          );
        },
      },

      // Overall Average Score Column
      {
        accessorKey: 'overallAverageScore',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold text-xs"
            >
              Overall
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-1 h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-1 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-1 h-3 w-3" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const score = row.original.overallAverageScore;
          const backgroundColor = getPerformanceColor(score);
          const textColor = getContrastTextColor(score);
          const category = getPerformanceCategory(score);

          return (
            <div
              className="text-center font-medium px-2 py-1 rounded border border-border text-xs"
              style={{
                backgroundColor,
                color: textColor
              }}
              title={`Overall: ${category}`}
            >
              {formatRatio(score)}
            </div>
          );
        },
      }
    ];

    // Add Omega ratio columns for each timeframe
    timeframes.forEach(timeframe => {
      baseColumns.push({
        id: `omega-${timeframe}`,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold text-xs"
          >
            Ω {timeframe}d
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        accessorFn: (row) => row.normalizedOmega[timeframe] ?? null,
        cell: ({ row }) => {
          const normalizedValue = row.original.normalizedOmega[timeframe];
          const rawValue = row.original.omegaRatios[timeframe];

          // If no data for this timeframe, show N/A
          if (normalizedValue === undefined || rawValue === undefined) {
            return (
              <div
                className="text-center text-xs px-1 py-1 rounded border border-border bg-muted text-muted-foreground"
                title="Insufficient data for this timeframe"
              >
                N/A
              </div>
            );
          }

          const backgroundColor = getPerformanceColor(normalizedValue);
          const textColor = getContrastTextColor(normalizedValue);
          const category = getPerformanceCategory(normalizedValue);

          return (
            <div
              className="text-center text-xs px-1 py-1 rounded border border-border"
              style={{
                backgroundColor,
                color: textColor
              }}
              title={`Raw Omega: ${formatRatio(rawValue)} | Category: ${category}`}
            >
              {formatRatio(normalizedValue)}
            </div>
          );
        },
      });
    });

    // Add Sharpe ratio columns for each timeframe
    timeframes.forEach(timeframe => {
      baseColumns.push({
        id: `sharpe-${timeframe}`,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold text-xs"
          >
            S {timeframe}d
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        accessorFn: (row) => row.normalizedSharpe[timeframe] ?? null,
        cell: ({ row }) => {
          const normalizedValue = row.original.normalizedSharpe[timeframe];
          const rawValue = row.original.sharpeRatios[timeframe];

          // If no data for this timeframe, show N/A
          if (normalizedValue === undefined || rawValue === undefined) {
            return (
              <div
                className="text-center text-xs px-1 py-1 rounded border border-border bg-muted text-muted-foreground"
                title="Insufficient data for this timeframe"
              >
                N/A
              </div>
            );
          }

          const backgroundColor = getPerformanceColor(normalizedValue);
          const textColor = getContrastTextColor(normalizedValue);
          const category = getPerformanceCategory(normalizedValue);

          return (
            <div
              className="text-center text-xs px-1 py-1 rounded border border-border"
              style={{
                backgroundColor,
                color: textColor
              }}
              title={`Raw Sharpe: ${formatRatio(rawValue)} | Category: ${category}`}
            >
              {formatRatio(normalizedValue)}
            </div>
          );
        },
      });
    });

    return baseColumns;
  }, [timeframes]);

  // Create table instance
  const table = useReactTable({
    data: tokens,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (tokens.length === 0) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-8 text-center">
        <div className="text-muted-foreground text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold mb-2">
          No Data Available
        </h3>
        <p className="text-muted-foreground">
          Select tokens and configure timeframes to see analysis results.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      {/* Table Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Performance Analysis Results
            </h3>
            <p className="text-sm text-muted-foreground">
              {tokens.length} tokens analyzed across {timeframes.length} timeframes
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-3 text-xs">
            {generateColorScale(5).map((color, index) => {
              const labels = ['Worst', 'Poor', 'Average', 'Good', 'Best'];
              return (
                <div key={index} className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-muted-foreground">{labels[index]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-center whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="text-center"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Table Footer */}
      <div className="p-4 border-t bg-muted/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            <strong>Legend:</strong> Ω = Omega Ratio, S = Sharpe Ratio, d = days
          </div>
          <div>
            Values are normalized using Z-Score. Hover cells for raw values.
          </div>
        </div>
      </div>
    </div>
  );
};