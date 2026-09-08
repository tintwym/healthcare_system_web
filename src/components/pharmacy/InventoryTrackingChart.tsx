import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';
import { PharmacyInventoryItem } from '../../types';

interface InventoryTrackingChartProps {
  inventory: PharmacyInventoryItem[];
}

interface ChartDatum {
  id: string;
  name: string;
  shortName: string;
  stock: number;
  reorder: number;
  projected7d: number;
  projected14d: number;
  daysToShortage: number | null;
  status: PharmacyInventoryItem['status'];
}

export const InventoryTrackingChart: React.FC<InventoryTrackingChartProps> = ({ inventory }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const data: ChartDatum[] = useMemo(() => {
    return inventory.map((item) => {
      // Simple consumption model: ~8% of reorder threshold per day (demo forecast)
      const dailyUse = Math.max(1, Math.round(item.reorderThreshold * 0.12));
      const daysToShortage =
        item.currentStock <= 0 ? 0 : Math.floor(item.currentStock / dailyUse);
      return {
        id: item.id,
        name: item.medicationName,
        shortName:
          item.medicationName.length > 18
            ? item.medicationName.slice(0, 16) + '…'
            : item.medicationName,
        stock: item.currentStock,
        reorder: item.reorderThreshold,
        projected7d: Math.max(0, item.currentStock - dailyUse * 7),
        projected14d: Math.max(0, item.currentStock - dailyUse * 14),
        daysToShortage: item.currentStock <= 0 ? 0 : daysToShortage,
        status: item.status,
      };
    });
  }, [inventory]);

  const atRisk = data.filter(
    (d) => d.daysToShortage !== null && d.daysToShortage <= 14
  ).length;

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const margin = { top: 24, right: 24, bottom: 72, left: 48 };
    const width = svgRef.current.clientWidth || 720;
    const height = 320;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.id))
      .range([0, innerW])
      .padding(0.28);

    const yMax = d3.max(data, (d) => Math.max(d.stock, d.reorder, d.projected7d)) || 100;
    const y = d3.scaleLinear().domain([0, yMax * 1.15]).nice().range([innerH, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3');

    g.selectAll('.grid path').attr('stroke', 'none');

    // Reorder threshold lines
    data.forEach((d) => {
      const cx = (x(d.id) || 0) + x.bandwidth() / 2;
      g.append('line')
        .attr('x1', (x(d.id) || 0))
        .attr('x2', (x(d.id) || 0) + x.bandwidth())
        .attr('y1', y(d.reorder))
        .attr('y2', y(d.reorder))
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3');
    });

    // Stock bars
    const bars = g
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.id) || 0)
      .attr('width', x.bandwidth())
      .attr('y', innerH)
      .attr('height', 0)
      .attr('rx', 4)
      .attr('fill', (d) =>
        d.stock === 0 ? '#e11d48' : d.stock <= d.reorder ? '#f59e0b' : '#2563eb'
      );

    bars
      .transition()
      .duration(600)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.stock))
      .attr('height', (d) => innerH - y(d.stock));

    // Projected 7-day markers
    g.selectAll('.proj')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => (x(d.id) || 0) + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.projected7d))
      .attr('r', 4)
      .attr('fill', '#0f172a')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Projected trend line (14-day)
    const line = d3
      .line<ChartDatum>()
      .x((d) => (x(d.id) || 0) + x.bandwidth() / 2)
      .y((d) => y(d.projected14d))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#7c3aed')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,4')
      .attr('d', line);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat((_, i) => data[i]?.shortName || ''))
      .selectAll('text')
      .attr('transform', 'rotate(-28)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.4em')
      .attr('dy', '0.4em')
      .style('font-size', '10px')
      .style('fill', '#64748b');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748b');

    g.selectAll('.domain').attr('stroke', '#cbd5e1');

    // Tooltip interactions
    const tip = d3.select(tooltipRef.current);
    bars
      .on('mousemove', (event, d) => {
        tip
          .style('opacity', '1')
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 8}px`)
          .html(
            `<strong>${d.name}</strong><br/>Stock: ${d.stock} units<br/>Reorder at: ${d.reorder}<br/>7-day proj: ${d.projected7d}<br/>14-day proj: ${d.projected14d}<br/>Days to shortage: ${d.daysToShortage ?? '—'}`
          );
      })
      .on('mouseleave', () => {
        tip.style('opacity', '0');
      });
  }, [data]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Package className="h-4 w-4 text-indigo-600" />
            Inventory Stock Levels & Shortage Forecast (D3)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Bars = current stock · Amber dash = reorder threshold · Dots = 7-day projection · Purple
            line = 14-day projected stock
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            atRisk > 0
              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {atRisk > 0 ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {atRisk} SKU(s) at risk within 14 days
        </div>
      </div>

      <div className="relative w-full">
        <svg ref={svgRef} className="w-full h-[320px]" role="img" aria-label="Medication inventory chart" />
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute z-10 opacity-0 bg-slate-900 text-white text-[10px] leading-relaxed px-2.5 py-2 rounded-lg shadow-lg max-w-[220px] transition-opacity"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <th className="py-1.5 pr-2 font-bold">Medication</th>
              <th className="py-1.5 pr-2 font-bold">Stock</th>
              <th className="py-1.5 pr-2 font-bold">7d Proj</th>
              <th className="py-1.5 pr-2 font-bold">14d Proj</th>
              <th className="py-1.5 font-bold">Shortage ETA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data
              .slice()
              .sort((a, b) => (a.daysToShortage ?? 999) - (b.daysToShortage ?? 999))
              .map((d) => (
                <tr key={d.id}>
                  <td className="py-1.5 pr-2 font-semibold text-slate-800 dark:text-slate-200">
                    {d.name}
                  </td>
                  <td className="py-1.5 pr-2">{d.stock}</td>
                  <td className="py-1.5 pr-2">{d.projected7d}</td>
                  <td className="py-1.5 pr-2">{d.projected14d}</td>
                  <td
                    className={`py-1.5 font-bold ${
                      (d.daysToShortage ?? 999) <= 7
                        ? 'text-rose-600'
                        : (d.daysToShortage ?? 999) <= 14
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {d.daysToShortage === 0
                      ? 'Out of stock'
                      : d.daysToShortage !== null
                      ? `~${d.daysToShortage} days`
                      : '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
