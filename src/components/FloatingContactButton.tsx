"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";

const CONTACT = {
  title: "お問い合わせ",
  orgLabel: "LoanFit運営",
  company: "Vivalapartner株式会社",
  person: "清水",
  tel: "090-7214-2300",
  lineId: "shimizu@vivala",
  lineUrl: "https://works.do/G5BUG7i",
  lineQrSrc: "/line-qr.png",
};

declare global {
  interface Window {
    __loanfitContactMounted?: boolean;
  }
}

export default function FloatingContactButton() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [modalStyle, setModalStyle] = useState<React.CSSProperties>({});

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__loanfitContactMounted) {
      setHidden(true);
      return;
    }
    window.__loanfitContactMounted = true;
    return () => {
      window.__loanfitContactMounted = false;
    };
  }, []);

  function recomputeModalStyle() {
    if (typeof window === "undefined" || !btnRef.current) return;

    const iw = window.innerWidth;
    const ih = window.innerHeight;
    const pad = 8;
    const gap = 12;

    const btn = btnRef.current.getBoundingClientRect();
    const mw = modalRef.current?.offsetWidth ?? Math.min(iw * 0.92, 360);
    const mh = modalRef.current?.offsetHeight ?? 420;

    let top = btn.top - mh - gap;
    if (top < pad) {
      top = btn.bottom + gap;
      if (top + mh > ih - pad) {
        top = Math.max(pad, ih - mh - pad);
      }
    }

    let left = btn.right - mw;
    if (left < pad) left = pad;
    if (left + mw > iw - pad) left = iw - mw - pad;

    setModalStyle({
      position: "fixed",
      top,
      left,
      maxHeight: "calc(100vh - 16px)",
      overflowY: "auto",
    });
  }

  useLayoutEffect(() => {
    if (!open) return;

    const raf = requestAnimationFrame(recomputeModalStyle);
    const ro = new ResizeObserver(() => recomputeModalStyle());
    if (modalRef.current) ro.observe(modalRef.current);

    const onScroll = () => recomputeModalStyle();
    window.addEventListener("resize", recomputeModalStyle);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", recomputeModalStyle);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  if (hidden) return null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-[#007FFF] text-white font-medium px-5 py-3 hover:bg-[#0066CC] hover:shadow-xl transition-all duration-200 whitespace-nowrap"
        title="お問い合わせを開く"
      ><span className="hidden sm:inline">銀行詳細・不動産相談はこちら</span>
        <span className="sm:hidden">相談する</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          className="z-[61] w-[min(92vw,360px)] rounded-2xl bg-white shadow-xl border border-slate-200"
          style={modalStyle}
        >
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold">{CONTACT.title}</h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
              aria-label="閉じる"
              type="button"
            >
              ×
            </button>
          </div>

          <div className="p-5 space-y-4 text-sm text-slate-800">
            <div className="space-y-1">
              <div className="font-medium">{CONTACT.orgLabel}</div>
              <div>運営会社: {CONTACT.company}</div>
              <div>担当者: {CONTACT.person}</div>

              <div className="flex items-center gap-2">
                <span>電話番号:</span>
                <a className="text-indigo-600 underline" href={`tel:${CONTACT.tel}`}>
                  {CONTACT.tel}
                </a>
                <button
                  onClick={() => navigator.clipboard?.writeText(CONTACT.tel)}
                  className="ml-1 text-xs rounded border px-2 py-0.5 hover:bg-slate-50"
                  type="button"
                >
                  コピー
                </button>
              </div>

              <div className="mt-3">
                <div className="font-medium mb-1">LINE 友だち追加</div>
                <div className="flex items-center gap-2">
                  <span>ID: {CONTACT.lineId}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(CONTACT.lineId)}
                    className="text-xs rounded border px-2 py-0.5 hover:bg-slate-50"
                    type="button"
                  >
                    コピー
                  </button>
                </div>
                <div className="break-all mt-1">
                  <span>URL: </span>
                  <a
                    className="text-indigo-600 underline"
                    href={CONTACT.lineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {CONTACT.lineUrl}
                  </a>
                </div>

                <div className="mt-3 border rounded-xl p-3 bg-slate-50 flex items-center justify-center">
                  <Image
                    src={CONTACT.lineQrSrc}
                    alt="LINE 友だち追加 QR"
                    width={220}
                    height={220}
                    className="rounded-md max-w-full h-auto"
                    priority
                    onLoadingComplete={() => recomputeModalStyle()}
                  />
                </div>
              </div>
            </div>

            {/* ←ここが修正ポイント */}
            <div className="flex justify-end gap-2 pt-1">
              <a
                href={CONTACT.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50"
              >
                LINE を開く
              </a>

              <a
                href={`tel:${CONTACT.tel}`}
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                電話する
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
