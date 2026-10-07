import { useEffect, useRef, useState } from "react";

const steps = [
  {
    id: 1,
    title: "Válaszd ki",
    description:
      "Válaszd ki a gyakorolni kívánt tantárgyat (Történelem, Matematika, stb.), a szintet (Közép/Emelt) és az érettségi évjáratot vagy témakört.",
  },
  {
    id: 2,
    title: "Gyakorolj & Ellenőrizz",
    description:
      "Oldj meg valódi érettségi tesztkérdéseket és esszéket. Az AI javítókulcs kevesebb mint 0.4 másodperc alatt pontos indoklással pontoz.",
  },
  {
    id: 3,
    title: "Fejlődj céltudatosan",
    description:
      "Kövesd nyomon a haladásodat diagramokon, lásd azonnal a pontvesztő gyenge témaköröket és javíts az előrejelzett érettségi jegyeden!",
  },
];

function WorkFlow() {
  const [currentStep, setCurrentStep] = useState(2);
  const [autoPlay, setAutoPlay] = useState(false);

  // -----------------------------
  // STEP KEZELÉS
  // -----------------------------

  const selectStep = (step) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    setCurrentStep((prev) => (prev === 3 ? 1 : prev + 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev === 1 ? 3 : prev - 1));
  };

  // -----------------------------
  // AUTOMATIKUS LEJÁTSZÁS
  // -----------------------------

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev === 3 ? 1 : prev + 1));
    }, 3500);

    return () => clearInterval(interval);
  }, [autoPlay]);

  const toggleAutoPlay = () => {
    setAutoPlay((prev) => !prev);
  };

  return (
    <main className="workflow-section">
      <div className="workflow-container">

        {/* =========================================
            FŐ GRID
        ========================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* =======================================
              BAL OLDAL
          ======================================== */}

          <div className="lg:col-span-6 flex flex-col justify-center space-y-7 pr-0 lg:pr-6 z-10">

            {/* Cím */}
            <div className="space-y-3.5">

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">

                Hogyan működik a{" "}

                <br className="hidden sm:inline" />

                <span className="text-white">
                  Tudástér?
                </span>

              </h1>

              <p className="text-base sm:text-lg text-purple-200/80 leading-relaxed max-w-xl">
                    A Tudástér végigvezet a felkészülés teljes folyamatán: válaszd ki, mit szeretnél gyakorolni, oldj meg valódi érettségi feladatokat, majd kövesd a fejlődésedet. Minden lépéssel közelebb kerülsz a magabiztos érettségihez.

              </p>

            </div>

            {/* =====================================
                LÉPÉSEK
            ====================================== */}

            <div className="space-y-3 pt-1">

              {steps.map((step) => {
                const isActive = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    className={`dark-step ${
                      isActive ? "active" : ""
                    } group cursor-pointer p-4 rounded-2xl flex items-start gap-4`}
                    onClick={() => selectStep(step.id)}
                    onMouseEnter={() => selectStep(step.id)}
                  >

                    {/* Sorszám */}

                    <div
                      className={`
                        step-badge
                        flex-shrink-0
                        w-10 h-10
                        rounded-xl
                        font-bold
                        flex items-center justify-center
                        text-sm
                        group-hover:scale-105
                        transition-transform
                        ${
                          isActive
                            ? "bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.6)]"
                            : "bg-purple-900/60 text-purple-200 border border-purple-400/30"
                        }
                      `}
                    >
                      0{step.id}
                    </div>

                    {/* Tartalom */}

                    <div className="flex-1">

                      <div className="flex items-center justify-between gap-3">

                        <h2 className="text-base font-bold text-white group-hover:text-purple-200 transition-colors">
                          {step.title}
                        </h2>

                        
                      </div>

                      <p className="text-sm text-purple-200/70 mt-1 leading-normal">
                        {step.description}
                      </p>

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          {/* =======================================
              JOBB OLDAL – DOSSIER
          ======================================== */}

          <div className="lg:col-span-6 flex justify-center items-center py-6 lg:py-2">

            <div className="relative w-full max-w-[520px] h-[550px] flex items-end justify-center select-none floating-stage">

              <div className="absolute w-[420px] h-[420px] rounded-full bg-violet-600/35 filter blur-[100px] -top-6 pointer-events-none" />

              <div className="absolute w-80 h-80 rounded-full bg-indigo-500/30 filter blur-[80px] bottom-6 pointer-events-none" />

              {/* =================================
                  DOSSIER
              ================================== */}

              <div
                className={`dossier-wrapper focus-${currentStep}`}
              >


                {/* =================================
                    PAPER 1
                ================================== */}

                <div
                  className="paper-sheet sheet-left p-5"
                  onClick={() => selectStep(1)}
                >

                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">

                    <div className="flex items-center gap-2">

                      <span className="w-2.5 h-2.5 rounded-full bg-violet-700" />

                      <span className="text-[11px] font-black tracking-wider text-[#351F5B] uppercase">
                        01. Paraméterek
                      </span>

                    </div>

                    <span className="text-[10px] font-bold text-violet-800 bg-violet-100/80 px-2 py-0.5 rounded">
                      1. Lépés
                    </span>

                  </div>

                  <div className="mt-3 space-y-2.5">

                    <div className="text-[12px] font-bold text-slate-800 flex items-center justify-between">

                      <span>
                        Tantárgy kiválasztása:
                      </span>

                      <span className="text-[10px] text-slate-500 font-normal">
                        Közép / Emelt
                      </span>

                    </div>

                    <div className="grid grid-cols-2 gap-2">

                      <div className="p-2 rounded-xl bg-purple-50 border-2 border-purple-300 text-xs font-bold text-[#351F5B] flex items-center justify-between shadow-xs">
                        <span>Történelem</span>

                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            clipRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            fillRule="evenodd"
                          />
                        </svg>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
                        Matematika
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
                        Magyar nyelv
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
                        Biológia
                      </div>

                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 mt-2">

                      <span className="font-medium">
                        Szint:{" "}
                        <strong className="text-slate-900">
                          Középszint
                        </strong>
                      </span>

                      <span className="px-2 py-0.5 rounded bg-purple-100 text-[#351F5B] font-bold text-[10px]">
                        2025. Érettségi
                      </span>

                    </div>

                  </div>

                </div>

                {/* =================================
                    PAPER 2
                ================================== */}

                <div
                  className="paper-sheet sheet-center p-5"
                  onClick={() => selectStep(2)}
                >

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">

                    <div className="flex items-center gap-2">

                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />

                      <span className="text-[11px] font-black tracking-wider text-[#351F5B] uppercase">
                        02. Érettségi Feladat
                      </span>

                    </div>

                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full">
                      +3 pont
                    </span>

                  </div>

                  <div className="mt-2.5 space-y-2">

                    <div className="text-[12px] font-bold text-slate-800 leading-snug">
                      Mikor jelent meg Széchenyi István híres
                      „Hitel” című reformműve?
                    </div>

                    <div className="space-y-1.5 pt-0.5">

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                        A) 1825-ben az első reformországgyűlésen
                      </div>

                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-400 text-[11px] font-bold text-emerald-800 flex items-center justify-between shadow-xs">

                        <span>
                          B) 1830-ban a reformprogram kezdeteként
                        </span>

                        <svg
                          className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            clipRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            fillRule="evenodd"
                          />
                        </svg>

                      </div>

                    </div>

                    <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-[10px] text-[#351F5B] leading-tight">

                      <strong>
                        Azonnali AI Javítás:
                      </strong>{" "}

                      Helyes válasz! A Hitel 1830-ban alapozta meg
                      a hazai polgári átalakulást és a modern
                      Magyarország gazdasági programját.

                    </div>

                  </div>

                </div>

                {/* =================================
                    PAPER 3
                ================================== */}

                <div
                  className="paper-sheet sheet-right p-5"
                  onClick={() => selectStep(3)}
                >

                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">

                    <div className="flex items-center gap-2">

                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />

                      <span className="text-[11px] font-black tracking-wider text-[#351F5B] uppercase">
                        03. Eredmény & Index
                      </span>

                    </div>

                    <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                      Biztos 5-ös
                    </span>

                  </div>

                  <div className="mt-3 space-y-2.5">

                    <div className="flex items-baseline justify-between">

                      <div>

                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Előrejelzett index
                        </div>

                        <div className="text-3xl font-black text-[#351F5B]">
                          92%

                          <span className="text-xs font-bold text-emerald-600">
                            {" "}+18%
                          </span>
                        </div>

                      </div>

                      <div className="text-right">

                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Megoldva
                        </div>

                        <div className="text-sm font-bold text-slate-800">
                          142 db feladat
                        </div>

                      </div>

                    </div>

                    <div>

                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">

                        <span>
                          Heti felkészültség
                        </span>

                        <span className="text-[#351F5B] font-bold">
                          92%
                        </span>

                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">

                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-[#351F5B]"
                          style={{ width: "92%" }}
                        />

                      </div>

                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">

                      <span>
                        Ajánlott fókusz:{" "}
                        <strong>
                          Reformkor gazdasága
                        </strong>
                      </span>

                      <span className="font-bold text-[#351F5B]">
                        →
                      </span>

                    </div>

                  </div>

                </div>

                {/* =================================
                    FRONT POCKET
                ================================== */}

                <div className="dossier-front-pocket flex flex-col justify-between p-6">

                  <div className="pocket-rim-glow" />
                  <div className="pocket-inner-shadow" />


                  {/* Navigáció */}

                  <div className="flex items-center justify-between pt-2 border-t border-white/20 text-white z-30">

                    <div className="flex items-center gap-2">

                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />

                      <span className="text-[11px] font-bold tracking-wider uppercase">
                        0{currentStep} / 03 Lépés
                      </span>

                    </div>

                    <div className="flex items-center gap-2">

                      <button
                        aria-label="Előző kártya"
                        onClick={prevStep}
                        className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        ←
                      </button>

                      <button
                        aria-label="Következő kártya"
                        onClick={nextStep}
                        className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        →
                      </button>

                    </div>

                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

    </main>
  );
}

export default WorkFlow;