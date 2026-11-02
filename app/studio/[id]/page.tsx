"use client";

import { Suspense } from "react";
import StudioPage from "../page";

export default function EditGamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060618] text-white flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <StudioPage />
    </Suspense>
  );
}
