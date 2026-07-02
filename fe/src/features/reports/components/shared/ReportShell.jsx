import PropTypes from 'prop-types';
import { useState } from 'react';

function toCsv(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

function download(filename, content) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

export default function ReportShell({ title, controls, chartContent, tableRows, tableHeaders, isLoading, isError, onRetry, extraActions }) {
  const [tab, setTab] = useState('chart');

  function handleExport() {
    const date = new Date().toISOString().split('T')[0];
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    download(`${slug}-${date}.csv`, toCsv(tableRows));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {controls}
        <div className="flex items-center gap-2">
          {extraActions}
          <button type="button" onClick={handleExport}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Chart / Table toggle + content */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {['chart','table'].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          )}
          {isError && (
            <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              Failed to load report.
              {onRetry && <button type="button" onClick={onRetry} className="font-medium underline">Retry</button>}
            </div>
          )}
          {!isLoading && !isError && (
            tab === 'chart' ? chartContent : (
              <div className="overflow-x-auto">
                {tableRows?.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">No data for this period.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {tableHeaders?.map((h) => (
                          <th key={h} className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows?.map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                          {tableHeaders?.map((h) => (
                            <td key={h} className="py-2.5 pr-4 text-slate-700">{row[h] ?? '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

ReportShell.propTypes = {
  title: PropTypes.string.isRequired,
  controls: PropTypes.node,
  chartContent: PropTypes.node,
  tableRows: PropTypes.array,
  tableHeaders: PropTypes.array,
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
  onRetry: PropTypes.func,
  extraActions: PropTypes.node,
};
