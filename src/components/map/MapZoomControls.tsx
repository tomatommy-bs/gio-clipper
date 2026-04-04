"use client";

import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Plus, Minus, Maximize2 } from "lucide-react";
import type { Transform } from "./GeoMapCanvas";

const ZOOM_STEP = 1.25;
const PAN_STEP = 80;
const SCALE_MIN = 0.3;
const SCALE_MAX = 20;

interface Props {
  transform: Transform;
  onTransformChange: (t: Transform) => void;
}

export default function MapZoomControls({ transform, onTransformChange }: Props) {
  function zoomIn() {
    onTransformChange({ ...transform, scale: Math.min(SCALE_MAX, transform.scale * ZOOM_STEP) });
  }

  function zoomOut() {
    onTransformChange({ ...transform, scale: Math.max(SCALE_MIN, transform.scale / ZOOM_STEP) });
  }

  function pan(dx: number, dy: number) {
    onTransformChange({ ...transform, x: transform.x + dx, y: transform.y + dy });
  }

  function fitView() {
    onTransformChange({ x: 0, y: 0, scale: 1 });
  }

  const pct = Math.round(transform.scale * 100);

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-row gap-1 items-end select-none">
      {/* パン矢印 + フィットビュー */}
      <div className="bg-background/90 backdrop-blur border rounded-lg shadow-md p-1 grid grid-cols-3 gap-0.5">
        <div />
        <ControlBtn onClick={() => pan(0, PAN_STEP)} aria-label="上へ移動"><ArrowUp className="w-3.5 h-3.5" /></ControlBtn>
        <div />

        <ControlBtn onClick={() => pan(PAN_STEP, 0)} aria-label="左へ移動"><ArrowLeft className="w-3.5 h-3.5" /></ControlBtn>
        <ControlBtn onClick={fitView} aria-label="全体を表示"><Maximize2 className="w-3.5 h-3.5" /></ControlBtn>
        <ControlBtn onClick={() => pan(-PAN_STEP, 0)} aria-label="右へ移動"><ArrowRight className="w-3.5 h-3.5" /></ControlBtn>

        <div />
        <ControlBtn onClick={() => pan(0, -PAN_STEP)} aria-label="下へ移動"><ArrowDown className="w-3.5 h-3.5" /></ControlBtn>
        <div />
      </div>

      {/* ズーム */}
      <div className="bg-background/90 backdrop-blur border rounded-lg shadow-md p-1 flex flex-col items-center justify-between self-stretch">
        <ControlBtn onClick={zoomIn} aria-label="ズームイン"><Plus className="w-3.5 h-3.5" /></ControlBtn>
        <span className="text-[10px] text-muted-foreground w-10 text-center tabular-nums">{pct}%</span>
        <ControlBtn onClick={zoomOut} aria-label="ズームアウト"><Minus className="w-3.5 h-3.5" /></ControlBtn>
      </div>
    </div>
  );
}

function ControlBtn({ children, onClick, "aria-label": label }: {
  children: React.ReactNode;
  onClick: () => void;
  "aria-label": string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-foreground transition-colors"
    >
      {children}
    </button>
  );
}
