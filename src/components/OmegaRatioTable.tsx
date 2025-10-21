/**
 * Omega Ratio Table Component
 * 
 * Displays Omega ratios across different timeframes with color coding
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
import type { TokenData } from '../types';
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

interface OmegaRatioTableProps {
  tokens: TokenData[];
  timeframes: number[];
}

export const OmegaRatioTable: React.FC<OmegaRatioTableProps> = ({
  tokens,
  timeframes
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'averageOmegaScore', desc: true }
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
              <span className="font-semibold uppercase">
                {token.symbol}
              </span>
            </div>
          );
        },
        enableSorting: false,
      },
      
      // Average Score Column
      {
        accessorKey: 'averageOmegaScore',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              Avg Ω
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-1 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-1 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-1 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          // Get raw Omega values
          const rawValues = timeframes
            .map(tf => row.original.omegaRatios[tf])
            .filter(val => val !== undefined);
          
          const colorScores = timeframes
            .map(tf => row.original.normalizedOmega[tf])
            .filter(val => val !== undefined);

          if (rawValues.length === 0) {
            return (
              <div className="text-center px-2 py-1 rounded border border-border bg-muted text-muted-foreground">
                N/A
              </div>
            );
          }

          // Always show raw values
          const avgRawValue = rawValues.reduce((sum, val) => sum + val, 0) / rawValues.length;
          
          // Use color scores for background color
          const avgColorScore = colorScores.length > 0 
            ? colorScores.reduce((sum, val) => sum + val, 0) / colorScores.length 
            : 0;

          return (
            <div 
              className="text-center font-medium px-2 py-1 rounded border border-border"
              style={{ 
                backgroundColor: getPerformanceColor(avgColorScore),
                color: getContrastTextColor(avgColorScore)
              }}
              title={`Average Omega Ratio: ${formatRatio(avgRawValue)} | ${getPerformanceCategory(avgColorScore)}`}
            >
              {formatRatio(avgRawValue)}
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
            {timeframe}d
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
          const colorScore = row.original.normalizedOmega[timeframe];
          const rawValue = row.original.omegaRatios[timeframe];
          
          // If no data for this timeframe, show N/A
          if (colorScore === undefined || rawValue === undefined) {
            return (
              <div 
                className="text-center text-xs px-1 py-1 rounded border border-border bg-muted text-muted-foreground"
                title="Insufficient data for this timeframe"
              >
                N/A
              </div>
            );
          }
          
          // Always show raw Omega ratio values
          const backgroundColor = getPerformanceColor(colorScore);
          const textColor = getContrastTextColor(colorScore);
          const category = getPerformanceCategory(colorScore);
          
          return (
            <div 
              className="text-center text-xs px-1 py-1 rounded border border-border"
              style={{ 
                backgroundColor,
                color: textColor
              }}
              title={`Omega Ratio: ${formatRatio(rawValue)} | Performance: ${category}`}
            >
              {formatRatio(rawValue)}
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
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
        <div className="text-muted-foreground text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold mb-2">
          No Data Available
        </h3>
        <p className="text-muted-foreground">
          Select tokens and configure timeframes to see Omega ratio analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* Table Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Omega Ratio Analysis
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
                    className="w-3 h-3 rounded border border-border" 
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
                className="hover:bg-muted/50"
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
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="text-sm text-muted-foreground text-center">
          <strong>Omega Ratio:</strong> Measures upside potential vs downside risk. Higher values indicate better risk-adjusted returns.
        </div>
      </div>
    </div>
  );
};