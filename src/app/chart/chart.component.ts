import {
  Component,
  Input,
  OnChanges,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener,
  SimpleChanges,
} from '@angular/core';

export interface ChartSeries {
  name: string;
  value: number;
  color: string;
}

export interface ChartOptions {
  type: 'line' | 'column' | 'pie';
  title: string;
  series: ChartSeries[];
}

/** Light-theme canvas drawing constants */
const THEME = {
  grid:    'rgba(255,255,255,0.07)',
  axis:    'rgba(255,255,255,0.2)',
  label:   'rgba(255,255,255,0.6)',
  labelBold: 'rgba(255,255,255,0.85)',
  donutBg: '#0f1117',
  pieSep:  '#080a0f',
};

const PAD = { top: 30, right: 24, bottom: 48, left: 52 };

@Component({
  selector: 'io-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
})
export class ChartComponent implements OnChanges, AfterViewInit {
  @Input() chartOptions!: ChartOptions;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animationId = 0;
  private animationProgress = 0;
  private dpr = window.devicePixelRatio || 1;

  /** Logical (CSS) canvas dimensions — used for all coordinate math */
  private logicalW = 0;
  private logicalH = 0;

  hoveredIndex = -1;
  tooltipX = 0;
  tooltipY = 0;
  tooltipLabel = '';
  tooltipValue = '';
  showTooltip = false;

  get total(): number {
    return this.chartOptions?.series?.reduce((s, d) => s + d.value, 0) ?? 0;
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resizeCanvas();
    this.animate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartOptions'] && this.ctx) {
      this.animationProgress = 0;
      cancelAnimationFrame(this.animationId);
      this.animate();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
    this.draw(1);
  }

  /**
   * Resize the canvas backing store to devicePixelRatio × CSS size.
   * This prevents blurry rendering on Retina / HiDPI screens.
   */
  resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    this.logicalW = parent.clientWidth;
    this.logicalH = parent.clientHeight;
    canvas.width  = Math.round(this.logicalW * this.dpr);
    canvas.height = Math.round(this.logicalH * this.dpr);
    canvas.style.width  = this.logicalW + 'px';
    canvas.style.height = this.logicalH + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  animate(): void {
    const duration = 900;
    const start = performance.now();
    const tick = (now: number) => {
      this.animationProgress = Math.min((now - start) / duration, 1);
      this.draw(this.easeOutCubic(this.animationProgress));
      if (this.animationProgress < 1) {
        this.animationId = requestAnimationFrame(tick);
      }
    };
    this.animationId = requestAnimationFrame(tick);
  }

  easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  draw(progress: number): void {
    if (!this.ctx || !this.chartOptions) return;
    const type = this.chartOptions.type;
    if (type === 'line')   this.drawLine(progress);
    else if (type === 'column') this.drawColumn(progress);
    else if (type === 'pie')    this.drawPie(progress);
  }

  // ─── LINE CHART ────────────────────────────────────────────────────────────
  drawLine(progress: number): void {
    const ctx = this.ctx;
    const W = this.logicalW, H = this.logicalH;
    const { top, right, bottom, left } = PAD;
    const cW = W - left - right, cH = H - top - bottom;

    ctx.clearRect(0, 0, W + 1, H + 1);

    const values = this.chartOptions.series.map((s) => s.value);
    const maxVal = Math.max(...values) * 1.2;
    const xStep  = cW / (values.length - 1 || 1);

    const points = values.map((v, i) => ({
      x: left + i * xStep,
      y: top  + cH - (v / maxVal) * cH,
    }));

    // Grid + Y labels
    for (let i = 0; i <= 5; i++) {
      const y = top + (cH / 5) * i;
      ctx.strokeStyle = THEME.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + cW, y); ctx.stroke();
      ctx.fillStyle = i === 0 ? THEME.labelBold : THEME.label;
      ctx.font = `${i === 0 ? 'bold ' : ''}12px "DM Mono", monospace`; ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal - (maxVal / 5) * i)), left - 10, y + 4);
    }

    // Axes
    ctx.strokeStyle = THEME.axis; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, top + cH); ctx.lineTo(left + cW, top + cH); ctx.stroke();

    // X labels — bigger, with tick marks
    this.chartOptions.series.forEach((s, i) => {
      const x = left + i * xStep;
      // tick
      ctx.strokeStyle = THEME.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, top + cH); ctx.lineTo(x, top + cH + 5); ctx.stroke();
      // label
      ctx.fillStyle = THEME.labelBold; ctx.font = 'bold 12px "DM Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(s.name, x, top + cH + 20);
    });

    if (points.length < 2) return;

    // At progress=1 draw all points directly, no interpolation needed
    let vp: { x: number; y: number }[];
    if (progress >= 1) {
      vp = points;
    } else {
      const totalSegments = points.length - 1;
      const rawProgress   = Math.min(progress * totalSegments, totalSegments - 0.0001);
      const segIndex      = Math.floor(rawProgress);
      const segFrac       = rawProgress - segIndex;
      const a = points[segIndex];
      const b = points[segIndex + 1];
      vp = [
        ...points.slice(0, segIndex + 1),
        ...(a && b ? [{ x: a.x + (b.x - a.x) * segFrac, y: a.y + (b.y - a.y) * segFrac }] : []),
      ];
    }

    if (vp.length < 2) return;

    // Area fill
    const areaGrad = ctx.createLinearGradient(0, top, 0, top + cH);
    areaGrad.addColorStop(0, this.hexToRgba(this.chartOptions.series[0].color, 0.15));
    areaGrad.addColorStop(1, this.hexToRgba(this.chartOptions.series[0].color, 0));
    ctx.beginPath(); ctx.moveTo(vp[0].x, top + cH);
    vp.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(vp[vp.length - 1].x, top + cH);
    ctx.closePath(); ctx.fillStyle = areaGrad; ctx.fill();

    // Line
    ctx.beginPath(); ctx.moveTo(vp[0].x, vp[0].y);
    for (let i = 1; i < vp.length; i++) {
      const cpx = (vp[i - 1].x + vp[i].x) / 2;
      const cpy = (vp[i - 1].y + vp[i].y) / 2;
      ctx.quadraticCurveTo(vp[i - 1].x, vp[i - 1].y, cpx, cpy);
    }
    ctx.lineTo(vp[vp.length - 1].x, vp[vp.length - 1].y);
    ctx.strokeStyle = this.chartOptions.series[0].color;
    ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

    // Dots
    if (progress === 1) {
      points.forEach((p, i) => {
        const hov = this.hoveredIndex === i;
        ctx.beginPath(); ctx.arc(p.x, p.y, hov ? 7 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = hov ? this.chartOptions.series[0].color : '#fff'; ctx.fill();
        ctx.strokeStyle = this.chartOptions.series[0].color; ctx.lineWidth = 2; ctx.stroke();
      });
    }
  }

  // ─── COLUMN CHART ──────────────────────────────────────────────────────────
  drawColumn(progress: number): void {
    const ctx = this.ctx;
    const W = this.logicalW, H = this.logicalH;
    const { top, right, bottom, left } = PAD;
    const cW = W - left - right, cH = H - top - bottom;

    ctx.clearRect(0, 0, W + 1, H + 1);

    const values = this.chartOptions.series.map((s) => s.value);
    const maxVal = Math.max(...values) * 1.2;
    const groupW = cW / values.length;
    const barW   = groupW * 0.52;

    for (let i = 0; i <= 5; i++) {
      const y = top + (cH / 5) * i;
      ctx.strokeStyle = THEME.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + cW, y); ctx.stroke();
      ctx.fillStyle = i === 0 ? THEME.labelBold : THEME.label;
      ctx.font = `${i === 0 ? 'bold ' : ''}12px "DM Mono", monospace`; ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal - (maxVal / 5) * i)), left - 10, y + 4);
    }

    ctx.strokeStyle = THEME.axis; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, top + cH); ctx.lineTo(left + cW, top + cH); ctx.stroke();

    this.chartOptions.series.forEach((s, i) => {
      const bH  = (s.value / maxVal) * cH * progress;
      const x   = left + i * groupW + (groupW - barW) / 2;
      const y   = top + cH - bH;
      const hov = this.hoveredIndex === i;
      const r   = Math.min(6, barW / 3);

      if (hov) {
        ctx.save();
        ctx.shadowColor  = this.hexToRgba(s.color, 0.3);
        ctx.shadowBlur   = 16;
        ctx.shadowOffsetY = 4;
      }

      const grad = ctx.createLinearGradient(x, y, x, top + cH);
      grad.addColorStop(0, this.lighten(s.color, hov ? 30 : 14));
      grad.addColorStop(1, s.color);
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, top + cH); ctx.lineTo(x, top + cH);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath(); ctx.fill();

      if (hov) ctx.restore();

      // X label — colored dot + bold name
      const labelX = x + barW / 2;
      const labelY = top + cH + 20;
      ctx.beginPath(); ctx.arc(labelX, labelY - 6, 3, 0, Math.PI * 2);
      ctx.fillStyle = s.color; ctx.fill();
      ctx.fillStyle = THEME.labelBold; ctx.font = 'bold 12px "DM Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(s.name, labelX, labelY + 8);

      if (progress > 0.82) {
        const alpha = Math.min(1, (progress - 0.82) * 5);
        ctx.fillStyle = this.hexToRgba(s.color, alpha);
        ctx.font = '11px "DM Mono", monospace'; ctx.textAlign = 'center';
        ctx.fillText(String(s.value), x + barW / 2, y - 8);
      }
    });
  }

  // ─── PIE / DONUT CHART ─────────────────────────────────────────────────────
  drawPie(progress: number): void {
    const ctx = this.ctx;
    const W = this.logicalW, H = this.logicalH;
    ctx.clearRect(0, 0, W + 1, H + 1);

    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) * 0.36;
    const innerR = radius * 0.52;
    const total  = this.total;
    let startAngle = -Math.PI / 2;

    this.chartOptions.series.forEach((s, i) => {
      const slice    = (s.value / total) * Math.PI * 2 * progress;
      const endAngle = startAngle + slice;
      const hov      = this.hoveredIndex === i;
      const offset   = hov ? 10 : 0;
      const midAngle = startAngle + slice / 2;
      const ox = Math.cos(midAngle) * offset;
      const oy = Math.sin(midAngle) * offset;

      const grad = ctx.createRadialGradient(cx + ox, cy + oy, innerR, cx + ox, cy + oy, radius + offset);
      grad.addColorStop(0, this.lighten(s.color, 22));
      grad.addColorStop(1, s.color);

      if (hov) { ctx.save(); ctx.shadowColor = this.hexToRgba(s.color, 0.4); ctx.shadowBlur = 20; }

      ctx.beginPath();
      ctx.moveTo(cx + ox, cy + oy);
      ctx.arc(cx + ox, cy + oy, radius + offset, startAngle, endAngle);
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

      if (hov) ctx.restore();

      ctx.strokeStyle = THEME.pieSep; ctx.lineWidth = 2.5; ctx.stroke();

      if (progress === 1 && s.value / total > 0.05) {
        const lr = (radius + innerR) / 2;
        const lx = cx + Math.cos(midAngle) * lr;
        const ly = cy + Math.sin(midAngle) * lr;
        // Shadow for readability
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6;
        ctx.fillStyle = '#fff'; ctx.font = '11px "DM Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round((s.value / total) * 100)}%`, lx, ly);
        ctx.restore();
        ctx.textBaseline = 'alphabetic';
      }

      startAngle = endAngle;
    });

    // Donut hole
    ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = THEME.donutBg; ctx.fill();

    // Center label
    if (progress === 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px "DM Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('TOTAL', cx, cy - 10);
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = 'bold 22px "Sora", sans-serif';
      ctx.fillText(String(total), cx, cy + 12);
      ctx.textBaseline = 'alphabetic';
    }
  }

  // ─── Mouse Events ───────────────────────────────────────────────────────────
  onMouseMove(event: MouseEvent): void {
    if (!this.chartOptions || this.animationProgress < 1) return;
    const canvas = this.canvasRef.nativeElement;
    const rect   = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    const prev        = this.hoveredIndex;
    this.hoveredIndex = -1;
    this.showTooltip  = false;

    const W = this.logicalW, H = this.logicalH;
    const { top, right, bottom, left } = PAD;
    const cW = W - left - right, cH = H - top - bottom;

    if (this.chartOptions.type === 'pie') {
      const cx = W / 2, cy = H / 2;
      const R  = Math.min(W, H) * 0.36, iR = R * 0.52;
      const dx = mx - cx, dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > iR && dist < R + 12) {
        let angle = Math.atan2(dy, dx) + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        const total = this.total;
        let st = 0;
        for (let i = 0; i < this.chartOptions.series.length; i++) {
          const sl = (this.chartOptions.series[i].value / total) * Math.PI * 2;
          if (angle >= st && angle < st + sl) { this.hoveredIndex = i; break; }
          st += sl;
        }
      }
    } else if (this.chartOptions.type === 'column') {
      const groupW = cW / this.chartOptions.series.length;
      const barW   = groupW * 0.52;
      for (let i = 0; i < this.chartOptions.series.length; i++) {
        const x = left + i * groupW + (groupW - barW) / 2;
        if (mx >= x && mx <= x + barW && my >= top && my <= top + cH) {
          this.hoveredIndex = i; break;
        }
      }
    } else {
      const xStep  = cW / (this.chartOptions.series.length - 1 || 1);
      const maxVal = Math.max(...this.chartOptions.series.map((s) => s.value)) * 1.2;
      for (let i = 0; i < this.chartOptions.series.length; i++) {
        const px = left + i * xStep;
        const py = top + cH - (this.chartOptions.series[i].value / maxVal) * cH;
        if (Math.abs(mx - px) < 22 && Math.abs(my - py) < 22) {
          this.hoveredIndex = i; break;
        }
      }
    }

    if (this.hoveredIndex !== -1) {
      const s = this.chartOptions.series[this.hoveredIndex];
      this.tooltipLabel = s.name;
      this.tooltipValue = String(s.value);
      this.tooltipX     = event.offsetX + 14;
      this.tooltipY     = event.offsetY - 14;
      this.showTooltip  = true;
    }

    if (prev !== this.hoveredIndex) this.draw(1);
  }

  onMouseLeave(): void {
    this.hoveredIndex = -1;
    this.showTooltip  = false;
    this.draw(1);
  }

  // ─── Utilities ──────────────────────────────────────────────────────────────
  hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  lighten(hex: string, amount: number): string {
    if (!hex.startsWith('#')) return hex;
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `rgb(${r},${g},${b})`;
  }
}