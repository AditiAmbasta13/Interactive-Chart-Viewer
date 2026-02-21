import { Component } from '@angular/core';
import { ChartOptions } from './chart/chart.component';

/** Static info panel content shown alongside each chart type */
export interface ChartInfo {
  eyebrow: string;
  heading: string;
  desc: string;
  stats: { label: string; value: string }[];
  useCases: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  /** Currently active tab — 'all' | 'line' | 'column' | 'pie' */
  activeTab: 'all' | 'line' | 'column' | 'pie' = 'all';

  readonly tabs = ['all', 'line', 'column', 'pie'] as const;

  readonly tabLabels: Record<string, string> = {
    all:    '⊞ All',
    line:   '╌ Line',
    column: '▮ Column',
    pie:    '◕ Pie',
  };

  // ── Chart option objects passed to <io-chart> ──────────────────────────────

  readonly lineOptions: ChartOptions = {
    type:  'line',
    title: 'Monthly Revenue',
    series: [
      { name: 'Jan', value: 42, color: '#6366f1' },
      { name: 'Feb', value: 58, color: '#6366f1' },
      { name: 'Mar', value: 47, color: '#6366f1' },
      { name: 'Apr', value: 73, color: '#6366f1' },
      { name: 'May', value: 91, color: '#6366f1' },
      { name: 'Jun', value: 84, color: '#6366f1' },
    ],
  };

  readonly columnOptions: ChartOptions = {
    type:  'column',
    title: 'Sales by Channel',
    series: [
      { name: 'Offline',   value: 30, color: '#f43f5e' },
      { name: 'Online',    value: 70, color: '#6366f1' },
      { name: 'Wholesale', value: 45, color: '#10b981' },
      { name: 'Direct',    value: 55, color: '#f59e0b' },
    ],
  };

  readonly pieOptions: ChartOptions = {
    type:  'pie',
    title: 'Traffic Sources',
    series: [
      { name: 'Organic',  value: 42, color: '#6366f1' },
      { name: 'Paid',     value: 28, color: '#f43f5e' },
      { name: 'Social',   value: 18, color: '#10b981' },
      { name: 'Referral', value: 12, color: '#f59e0b' },
    ],
  };

  // ── Info panel content ─────────────────────────────────────────────────────

  readonly info: Record<string, ChartInfo> = {
    line: {
      eyebrow: 'LINE CHART',
      heading: 'Trends over time',
      desc:    'A line chart connects data points with a continuous curve, making it ideal for visualising how values evolve across a sequence — most commonly time. The area fill below the line adds a sense of volume and direction.',
      stats: [
        { label: 'Data points', value: '6 months'         },
        { label: 'Peak value',  value: '91 (May)'         },
        { label: 'Growth',      value: '+100% Jan → May'  },
        { label: 'Trend',       value: '↑ Upward'         },
      ],
      useCases: [
        'Revenue or sales over months / quarters',
        'Website traffic or user growth over time',
        'Stock price movement across a trading day',
        'Sensor readings across time intervals',
      ],
      
    },
    column: {
      eyebrow: 'COLUMN CHART',
      heading: 'Compare categories',
      desc:    'Column charts use vertical bars to compare discrete categories. Bar height is proportional to value, making differences immediately visible — one of the most intuitive chart types for any audience.',
      stats: [
        { label: 'Categories', value: '4 channels'    },
        { label: 'Highest',    value: 'Online (70)'   },
        { label: 'Lowest',     value: 'Offline (30)'  },
        { label: 'Total',      value: '200 units'     },
      ],
      useCases: [
        'Comparing sales figures across product lines',
        'Survey responses across different groups',
        'Monthly expenses by category',
        'Performance scores across team members',
      ],
    },
    pie: {
      eyebrow: 'PIE / DONUT CHART',
      heading: 'Part-to-whole share',
      desc:    'A donut chart shows how each part contributes to a total. Arc length is proportional to share. The hollow centre displays the total value at a glance, saving space and drawing the eye.',
      stats: [
        { label: 'Segments', value: '4 sources'       },
        { label: 'Largest',  value: 'Organic (42%)'   },
        { label: 'Smallest', value: 'Referral (12%)'  },
        { label: 'Total',    value: '100 sessions'    },
      ],
      useCases: [
        'Market share breakdown across competitors',
        'Budget allocation across departments',
        'Traffic source distribution',
        'Device usage split (mobile / tablet / desktop)',
      ],
    },
  };

  get activeInfo(): ChartInfo {
    return this.info[this.activeTab];
  }

  setTab(tab: 'all' | 'line' | 'column' | 'pie'): void {
    this.activeTab = tab;
  }
}