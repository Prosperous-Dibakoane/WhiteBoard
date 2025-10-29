import React from "react";
import PaintCanvas from "./components/PaintCanvas";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
      <PaintCanvas />
    </div>
  );
}
