import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild, computed, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as pdfjsLib from 'pdfjs-dist';
import { PosicionFirma } from '../../../../models/firma.model';
import { ToastService } from '../../../../services/toast.service';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.js';

type Rol = 'trabajador' | 'rrhh';

interface SignBox {
  id: string;
  rol: Rol;
  page: number;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
}

@Component({
  selector: 'app-firma-placement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './firma-placement.component.html',
  styleUrls: ['./firma-placement.component.css'],
})
export class FirmaPlacementComponent implements AfterViewInit, OnDestroy {
  @Input() set base64(v: string | null) {
    this._b64 = v;
    if (v && this.viewReady) this.cargar();
  }
  private _b64: string | null = null;

  @Input() set modoFirmantes(v: 'solo' | 'doble') {
    this.signers = v === 'doble' ? ['trabajador', 'rrhh'] : ['trabajador'];
    if (v !== 'doble') {
      this.cajas.set(this.cajas().filter(b => b.rol !== 'rrhh'));
    }
  }
  signers: Rol[] = ['trabajador'];

  @Input() posicionesIniciales: PosicionFirma[] | null = null;

  @Output() guardar = new EventEmitter<PosicionFirma[]>();
  @Output() cancelar = new EventEmitter<void>();

  private toast = inject(ToastService);

  @ViewChild('mainCanvas') mainCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasWrap') canvasWrap!: ElementRef<HTMLElement>;
  @ViewChild('stage') stage!: ElementRef<HTMLElement>;

  loading = signal(true);
  error = signal<string | null>(null);
  numPages = signal(0);
  currentPage = signal(1);
  thumbs = signal<string[]>([]);

  cajas = signal<SignBox[]>([]);
  seleccionadaId = signal<string | null>(null);
  readonly seleccionada = computed(() => this.cajas().find(b => b.id === this.seleccionadaId()) ?? null);

  readonly rolInfo: Record<Rol, { label: string; color: string }> = {
    trabajador: { label: 'Trabajador', color: '#476fab' },
    rrhh: { label: 'RRHH', color: '#27ae60' },
  };

  private readonly DEF_W = 22;
  private readonly DEF_H = 8;
  private readonly MIN_SIZE = 5;
  private readonly DEF_LEFT: Record<Rol, number> = { trabajador: 52, rrhh: 8 };
  private idSeq = 0;

  private pdfDoc: any = null;
  private viewReady = false;
  private renderTask: any = null;
  private drag: { id: string; mode: 'move' | 'resize'; startX: number; startY: number; box: SignBox; stageW: number; stageH: number } | null = null;

  async ngAfterViewInit(): Promise<void> {
    this.viewReady = true;
    this.restaurarPosiciones();
    if (this._b64) await this.cargar();
  }

  private base64ToBytes(b64: string): Uint8Array {
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  private async cargar(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = this.base64ToBytes(this._b64!);
      this.pdfDoc = await pdfjsLib.getDocument({ data }).promise;
      this.numPages.set(this.pdfDoc.numPages);
      this.currentPage.set(1);
      await this.renderPage(1);
      await this.generarMiniaturas();
      this.loading.set(false);
    } catch (e) {
      console.error('firma-placement: error cargando PDF', e);
      this.error.set('No se pudo cargar el documento.');
      this.loading.set(false);
    }
  }

  private async renderPage(n: number): Promise<void> {
    if (!this.pdfDoc || !this.mainCanvas) return;
    const page = await this.pdfDoc.getPage(n);
    const canvas = this.mainCanvas.nativeElement;
    const wrap = this.canvasWrap?.nativeElement;
    const base = page.getViewport({ scale: 1 });
    const anchoDisponible = (wrap?.clientWidth ? wrap.clientWidth - 28 : 600);
    const scale = Math.max(0.2, anchoDisponible / base.width);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    if (this.renderTask) { try { this.renderTask.cancel(); } catch { /* noop */ } }
    this.renderTask = page.render({ canvasContext: ctx, viewport });
    await this.renderTask.promise;
  }

  private async generarMiniaturas(): Promise<void> {
    const out: string[] = [];
    for (let i = 1; i <= this.numPages(); i++) {
      const page = await this.pdfDoc.getPage(i);
      const vp = page.getViewport({ scale: 0.22 });
      const c = document.createElement('canvas');
      c.width = vp.width;
      c.height = vp.height;
      await page.render({ canvasContext: c.getContext('2d')!, viewport: vp }).promise;
      out.push(c.toDataURL('image/png'));
    }
    this.thumbs.set(out);
  }

  async irAPagina(n: number): Promise<void> {
    if (n < 1 || n > this.numPages() || n === this.currentPage()) return;
    this.currentPage.set(n);
    await this.renderPage(n);
  }
  prev(): void { this.irAPagina(this.currentPage() - 1); }
  next(): void { this.irAPagina(this.currentPage() + 1); }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, v));
  }
  redondear(n: number): number { return Math.round(n); }
  rolFondo(rol: Rol): string {
    return rol === 'rrhh' ? 'rgba(39, 174, 96, 0.14)' : 'rgba(71, 111, 171, 0.14)';
  }
  contarRol(rol: Rol): number { return this.cajas().filter(b => b.rol === rol).length; }

  private restaurarPosiciones(): void {
    const pos = this.posicionesIniciales;
    if (!pos || !pos.length || this.cajas().length) return;
    this.cajas.set(pos.map(p => ({
      id: 'b' + (++this.idSeq),
      rol: p.rol,
      page: p.page,
      leftPct: p.xo,
      topPct: p.yo,
      widthPct: p.width,
      heightPct: p.height,
    })));
  }


  anadir(rol: Rol): void {
    const enPagina = this.cajas().filter(b => b.rol === rol && b.page === this.currentPage()).length;
    const off = (enPagina % 5) * 4;
    const box: SignBox = {
      id: 'b' + (++this.idSeq),
      rol,
      page: this.currentPage(),
      leftPct: this.clamp(this.DEF_LEFT[rol] + off, 0, 100 - this.DEF_W),
      topPct: this.clamp(70 + off, 0, 100 - this.DEF_H),
      widthPct: this.DEF_W,
      heightPct: this.DEF_H,
    };
    this.cajas.set([...this.cajas(), box]);
    this.seleccionadaId.set(box.id);
  }

  eliminar(id: string): void {
    this.cajas.set(this.cajas().filter(b => b.id !== id));
    if (this.seleccionadaId() === id) this.seleccionadaId.set(null);
  }

  deseleccionar(): void { this.seleccionadaId.set(null); }

  startDrag(id: string, ev: MouseEvent): void { this.seleccionadaId.set(id); this.iniciar(id, 'move', ev); }
  startResize(id: string, ev: MouseEvent): void { this.seleccionadaId.set(id); this.iniciar(id, 'resize', ev); }

  private iniciar(id: string, mode: 'move' | 'resize', ev: MouseEvent): void {
    const box = this.cajas().find(b => b.id === id);
    if (!box || !this.stage) return;
    ev.preventDefault(); ev.stopPropagation();
    const s = this.stage.nativeElement;
    this.drag = { id, mode, startX: ev.clientX, startY: ev.clientY, box: { ...box }, stageW: s.clientWidth, stageH: s.clientHeight };
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (ev: MouseEvent): void => {
    const d = this.drag;
    if (!d) return;
    const dxPct = ((ev.clientX - d.startX) / d.stageW) * 100;
    const dyPct = ((ev.clientY - d.startY) / d.stageH) * 100;
    const nb: SignBox = { ...d.box };
    if (d.mode === 'move') {
      nb.leftPct = this.clamp(d.box.leftPct + dxPct, 0, 100 - nb.widthPct);
      nb.topPct = this.clamp(d.box.topPct + dyPct, 0, 100 - nb.heightPct);
    } else {
      nb.widthPct = this.clamp(d.box.widthPct + dxPct, this.MIN_SIZE, 100 - nb.leftPct);
      nb.heightPct = this.clamp(d.box.heightPct + dyPct, this.MIN_SIZE, 100 - nb.topPct);
    }
    this.cajas.set(this.cajas().map(b => (b.id === d.id ? nb : b)));
  };

  private onMouseUp = (): void => {
    this.drag = null;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  private aPosicion(box: SignBox): PosicionFirma {
    return {
      rol: box.rol,
      page: box.page,
      xo: this.clamp(Math.round(box.leftPct), 0, 90),
      yo: this.clamp(Math.round(box.topPct), 0, 90),
      width: this.clamp(Math.round(box.widthPct), 5, 100),
      height: this.clamp(Math.round(box.heightPct), 5, 100),
    };
  }

  onGuardar(): void {
    // Validar que cada firmante requerido tenga al menos una firma ubicada.
    const faltan = this.signers.filter(rol => this.contarRol(rol) === 0);
    if (faltan.length) {
      const nombres = faltan.map(rol => this.rolInfo[rol].label).join(' y ');
      this.toast.show('warning', `⚠ Falta ubicar la firma de ${nombres}.`);
      return;
    }
    this.guardar.emit(this.cajas().map(b => this.aPosicion(b)));
    this.toast.show('success', '✓ Ubicación de firma guardada');
  }
  onCancelar(): void { this.cancelar.emit(); }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    if (this.renderTask) { try { this.renderTask.cancel(); } catch { /* noop */ } }
    if (this.pdfDoc) { try { this.pdfDoc.destroy(); } catch { /* noop */ } }
  }
}
