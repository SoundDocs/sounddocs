/**
 * A simple reusable table component
 * 
 * Features:
 * - Generic typing for table data
 * - Custom cell rendering
 * - Responsive design
 * - Accessible table structure
 * 
 * @param data - Array of table data
 * @param columns - Array of column definitions
 */

import React from 'react';

export interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (item: T) => React.ReactNode;
  width?: number;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
}

export function Table<T>({ data, columns }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full divide-y divide-gray-700">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                style={{ width: column.width }}
                className="px-4 py-3 text-left text-sm font-medium text-gray-300 bg-gray-800"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 bg-gray-800">
          {data.map((item, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td
                  key={`${rowIndex}-${colIndex}`}
                  className="px-4 py-3 text-sm text-gray-300"
                >
                  {column.cell 
                    ? column.cell(item)
                    : String(item[column.accessorKey] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}