import type { CSSProperties } from 'react';
import './ContributionGraph.css';

export interface ContributionDay {
  date: string;
  count: number;
  color: string;
}

interface ContributionGraphProps {
  days: ContributionDay[];
  totalContributions: number;
  username?: string;
  compact?: boolean;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function groupWeeks(days: ContributionDay[]): ContributionDay[][] {
  const weeks: ContributionDay[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

export default function ContributionGraph({ days, totalContributions, username = '', compact = false }: ContributionGraphProps) {
  const weeks = groupWeeks(days);
  const maxCount = days.reduce((currentMax, day) => Math.max(currentMax, day.count), 0);
  const activeDays = days.filter(day => day.count > 0).length;
  const rangeLabel = days.length > 0
    ? `${formatDate(days[0].date)} - ${formatDate(days[days.length - 1].date)}`
    : 'Belum ada data';

  return (
    <div className={compact ? 'contribution-graph compact' : 'contribution-graph'}>
      <div className="contribution-graph-head">
        <div className="contribution-graph-copy">
          <div className="contribution-graph-kicker">Activity Heatmap</div>
          <div className="contribution-graph-total">{totalContributions}</div>
          <div className="contribution-graph-meta">
            kontribusi{username ? ` @${username}` : ''}
          </div>
        </div>
        <div className="contribution-graph-badges">
          <span className="contribution-graph-badge">{weeks.length} minggu</span>
          <span className="contribution-graph-badge">{activeDays} hari aktif</span>
        </div>
      </div>

      <div className="contribution-graph-panel">
        <div className="contribution-graph-range">{rangeLabel}</div>
        <div className="contribution-graph-scroll">
          <div className="contribution-graph-grid" role="img" aria-label={`Grafik kontribusi GitHub ${username || ''}`.trim()}>
            {weeks.map((week, weekIndex) => (
              <div className="contribution-graph-week" key={`${week[0]?.date || 'week'}-${weekIndex}`}>
                {week.map(day => (
                  <span
                    key={day.date}
                    className={`contribution-graph-cell ${day.count === 0 ? 'is-empty' : ''}`}
                    style={{ '--cell-color': day.color || '#1f2937' } as CSSProperties}
                    title={`${formatDate(day.date)} - ${day.count} kontribusi`}
                    aria-label={`${formatDate(day.date)} ${day.count} kontribusi`}
                  >
                    <span className="contribution-graph-tooltip">
                      {formatDate(day.date)} - {day.count} kontribusi
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="contribution-graph-legend">
        <span className="contribution-graph-legend-text">Rendah</span>
        <div className="contribution-graph-legend-scale">
          <span className="contribution-graph-legend-cell is-empty" />
          <span className="contribution-graph-legend-cell is-low" />
          <span className="contribution-graph-legend-cell is-mid" />
          <span className="contribution-graph-legend-cell is-high" />
          <span className="contribution-graph-legend-cell is-top" />
        </div>
        <span className="contribution-graph-legend-text">Tinggi {maxCount > 0 ? `(${maxCount}/hari)` : ''}</span>
      </div>
    </div>
  );
}
