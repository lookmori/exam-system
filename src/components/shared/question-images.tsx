"use client";

import { useState } from "react";

function ImageWithLightbox({ src, className }: { src: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        src={src}
        alt=""
        className={`cursor-pointer object-cover rounded-md border border-slate-200 hover:opacity-90 transition-opacity ${className || "max-w-full max-h-48"}`}
        onClick={() => setOpen(true)}
      />
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setOpen(false)}>
          <img src={src} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />
          <span className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-slate-300 cursor-pointer" onClick={() => setOpen(false)}>&times;</span>
        </div>
      )}
    </>
  );
}

export function TitleImages({ images }: { images?: string[] }) {
  if (!images || images.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((src, i) => <ImageWithLightbox key={i} src={src} />)}
    </div>
  );
}

export function OptionImages({ images, optionKey }: { images?: string[]; optionKey: string }) {
  if (!images || images.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1 ml-10">
      {images.map((src, i) => <ImageWithLightbox key={i} src={src} className="max-w-24 max-h-16" />)}
    </div>
  );
}

export function AnalysisImages({ images }: { images?: string[] }) {
  if (!images || images.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((src, i) => <ImageWithLightbox key={i} src={src} />)}
    </div>
  );
}
