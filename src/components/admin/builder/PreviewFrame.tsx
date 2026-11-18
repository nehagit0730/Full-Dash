import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

/** The viewport each device previews at. Desktop matches a typical laptop. */
const DEVICE_WIDTH: Record<PreviewDevice, number> = {
  desktop: 1366,
  tablet: 820,
  mobile: 390
};

const FRAME_HTML =
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>' +
  '<body style="margin:0"><div id="preview-root"></div></body></html>';

interface PreviewFrameProps {
  device: PreviewDevice;
  children: React.ReactNode;
  /** Receives the frame's document once mounted (used to scroll to a section). */
  onDocument?: (doc: Document | null) => void;
}

/**
 * Renders the store page inside an iframe so it is laid out at a real device
 * width. Tailwind breakpoints are media queries, which respond to the viewport,
 * not to the column the preview sits in; rendering in-place in a narrow column
 * is why the old builder never looked like the live page.
 *
 * The app's stylesheets are mirrored into the frame (and re-mirrored when Vite
 * hot-reloads them), and the React tree is portalled in, so it keeps the
 * editor's state and handlers.
 */
export default function PreviewFrame({ device, children, onDocument }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  // Measure the canvas so a desktop-width page can be scaled down to fit.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const syncStyles = () => {
      doc.head.querySelectorAll('[data-mirrored]').forEach(n => n.remove());
      document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.setAttribute('data-mirrored', '');
        doc.head.appendChild(clone);
      });
    };
    syncStyles();

    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncStyles);
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    (iframeRef.current as any).__styleObserver = observer;

    setMountNode(doc.getElementById('preview-root'));
    onDocument?.(doc);
  };

  useEffect(() => () => {
    (iframeRef.current as any)?.__styleObserver?.disconnect();
    onDocument?.(null);
  }, []);

  // Desktop fills a wide canvas, and never drops below a laptop-sized layout
  // (it is scaled down to fit instead).
  const targetWidth = device === 'desktop' ? Math.max(1280, box.w) : DEVICE_WIDTH[device];
  const available = Math.max(0, box.w - (device === 'desktop' ? 0 : 48));
  const scale = available > 0 && targetWidth > available ? available / targetWidth : 1;
  const frameHeight = scale < 1 ? box.h / scale : box.h - (device === 'desktop' ? 0 : 32);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <div
        className={`absolute top-0 ${device === 'desktop' ? 'left-0' : 'left-1/2'} ${device === 'desktop' ? '' : 'mt-4'}`}
        style={{
          width: targetWidth,
          height: frameHeight,
          transform: `${device === 'desktop' ? '' : 'translateX(-50%) '}scale(${scale})`,
          transformOrigin: device === 'desktop' ? 'top left' : 'top center'
        }}
      >
        <iframe
          ref={iframeRef}
          title="Page preview"
          srcDoc={FRAME_HTML}
          onLoad={handleLoad}
          className={`h-full w-full bg-white ${device === 'desktop' ? '' : 'rounded-xl shadow-lg ring-1 ring-black/10'}`}
        />
      </div>
      {mountNode && createPortal(children, mountNode)}
    </div>
  );
}
