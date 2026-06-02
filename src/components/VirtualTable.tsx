import React, { useRef, useState, UIEvent } from 'react';

interface VirtualTableProps<T> {
  items: T[];
  itemHeight: number; // Estimated row height in pixels
  viewportHeight: number; // Maximum height of the scroll container
  renderRow: (item: T, index: number) => React.ReactNode;
  header: React.ReactNode;
  emptyMessage: React.ReactNode;
}

export default function VirtualTable<T>({
  items,
  itemHeight,
  viewportHeight,
  renderRow,
  header,
  emptyMessage
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const itemCount = items.length;

  if (itemCount === 0) {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto w-full bg-white dark:bg-slate-900">
        <table className="min-w-[680px] md:min-w-full text-left border-collapse">
          {header}
        </table>
        {emptyMessage}
      </div>
    );
  }

  // Calculate visible range with a buffer to avoid flickering on fast scrolling
  const buffer = 4;
  let startIndex = Math.floor(scrollTop / itemHeight) - buffer;
  startIndex = Math.max(0, startIndex);

  let endIndex = Math.ceil((scrollTop + viewportHeight) / itemHeight) + buffer;
  endIndex = Math.min(itemCount - 1, endIndex);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Height of spacers pushing rendered elements to the right place
  const topSpacerHeight = startIndex * itemHeight;
  const bottomSpacerHeight = Math.max(0, (itemCount - 1 - endIndex) * itemHeight);

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto w-full bg-white dark:bg-slate-900 scrollbar-thin focus:outline-hidden"
      style={{ maxHeight: `${viewportHeight}px`, overflowY: 'auto' }}
    >
      <table className="min-w-[680px] md:min-w-full text-left border-collapse align-middle table-layout-fixed">
        {header}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {topSpacerHeight > 0 && (
            <tr style={{ height: `${topSpacerHeight}px` }}>
              <td colSpan={10} style={{ padding: 0, height: `${topSpacerHeight}px` }} />
            </tr>
          )}
          
          {visibleItems.map((item, index) => renderRow(item, startIndex + index))}

          {bottomSpacerHeight > 0 && (
            <tr style={{ height: `${bottomSpacerHeight}px` }}>
              <td colSpan={10} style={{ padding: 0, height: `${bottomSpacerHeight}px` }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
