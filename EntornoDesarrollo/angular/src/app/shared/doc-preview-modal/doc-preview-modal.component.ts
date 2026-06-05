import { Component, OnDestroy, computed, effect, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-doc-preview-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doc-preview-modal.component.html',
  styles: [`
    .doc-preview-overlay {
      position: fixed; inset: 0; z-index: 1100;
      background: rgba(15, 23, 42, 0.62);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 40px 20px;
      animation: doc-preview-fade-in 0.2s ease-out;
    }
    @keyframes doc-preview-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .doc-preview-modal {
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.30);
      width: 100%; max-width: 920px;
      height: 100%; max-height: 820px;
      display: flex; flex-direction: column;
      overflow: hidden;
      animation: doc-preview-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes doc-preview-slide-in {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .doc-preview-header {
      padding: 14px 20px;
      background: linear-gradient(180deg, #fafbff 0%, #fff 100%);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
    }
    .doc-preview-title {
      display: flex; align-items: center; gap: 12px;
      min-width: 0; flex: 1;
    }
    .doc-preview-icon {
      width: 40px; height: 40px;
      background: #fee2e2; color: #ef4444;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .doc-preview-name {
      font-size: 14px; font-weight: 700; color: var(--text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .doc-preview-meta {
      font-size: 12px; color: var(--text-muted);
      margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .doc-preview-close {
      width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      background: transparent; color: var(--text-muted);
      border: none; border-radius: 8px;
      cursor: pointer; flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
    }
    .doc-preview-close:hover {
      background: #fee2e2; color: #b91c1c;
    }
    .doc-preview-body {
      flex: 1; min-height: 0;
      background: #f3f4f6;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .doc-preview-body iframe {
      width: 100%; height: 100%;
      border: none; background: #fff;
    }
    .doc-preview-body img {
      max-width: 100%; max-height: 100%;
      object-fit: contain;
      display: block;
    }
    .doc-preview-placeholder {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
      padding: 40px 30px;
      max-width: 420px;
    }
    .doc-preview-placeholder-icon {
      width: 80px; height: 80px;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 18px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      color: #9ca3af;
    }
    .doc-preview-placeholder h3 {
      font-size: 15px; font-weight: 700; color: var(--text);
      margin: 0 0 6px; word-break: break-word;
    }
    .doc-preview-placeholder p {
      font-size: 13px; color: var(--text-muted);
      margin: 2px 0; line-height: 1.5;
    }
    .doc-preview-placeholder .hint {
      font-size: 11px; opacity: 0.75;
      margin-top: 8px;
    }
  `]
})
export class DocPreviewModalComponent implements OnDestroy {
  private sanitizer = inject(DomSanitizer);

  open = input<boolean>(false);
  nombre = input<string>('Documento');
  meta = input<string | null>(null);
  base64 = input<string | null>(null);

  closed = output<void>();

  private ext = computed(() => {
    const n = this.nombre() || '';
    const i = n.lastIndexOf('.');
    return i >= 0 ? n.slice(i + 1).toLowerCase() : '';
  });


  private mimePorContenido = computed(() => {
    const head = (this.base64() || '').slice(0, 12);
    if (head.startsWith('JVBER')) return 'application/pdf'; // %PDF
    if (head.startsWith('iVBOR')) return 'image/png';
    if (head.startsWith('/9j/'))  return 'image/jpeg';
    if (head.startsWith('R0lG'))  return 'image/gif';
    if (head.startsWith('Qk'))    return 'image/bmp';
    return '';
  });

  private mimePorExtension = computed(() => {
    switch (this.ext()) {
      case 'pdf':  return 'application/pdf';
      case 'png':  return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif':  return 'image/gif';
      case 'webp': return 'image/webp';
      case 'bmp':  return 'image/bmp';
      case 'svg':  return 'image/svg+xml';
      default:     return '';
    }
  });



  mime = computed(() => this.mimePorContenido() || this.mimePorExtension());

  esImagen = computed(() => this.mime().startsWith('image/'));
  esPdf = computed(() => this.mime() === 'application/pdf');

  noPreviewable = computed(() => !!this.base64() && !this.esImagen() && !this.esPdf());

  pdfSrc = computed<SafeResourceUrl | null>(() => {
    if (!this.open() || !this.esPdf()) return null;
    const b64 = this.base64();
    if (!b64) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`data:application/pdf;base64,${b64}`);
  });

  imgSrc = computed<SafeUrl | null>(() => {
    if (!this.open() || !this.esImagen()) return null;
    const b64 = this.base64();
    if (!b64) return null;
    return this.sanitizer.bypassSecurityTrustUrl(`data:${this.mime()};base64,${b64}`);
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        document.addEventListener('keydown', this.onEscKey);
      } else {
        document.removeEventListener('keydown', this.onEscKey);
      }
    });
  }

  cerrar(): void {
    this.closed.emit();
  }

  private onEscKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') this.cerrar();
  };

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.onEscKey);
  }
}
