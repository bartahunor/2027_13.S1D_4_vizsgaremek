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
      "Oldj meg valódi érettségi tesztkérdéseket! A kitöltés végén azonnali javítókulcs és részletes pontozás vár.",
  },
  {
    id: 3,
    title: "Fejlődj céltudatosan",
    description:
      "Lásd át a fejlődésedet grafikonokon! Azonnal megmutatjuk, hol mennek el még a pontok, így célzottan gyakorolhatsz, és javíthatsz a várható érettségi eredményeden.",
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
                    className={`dark-step ${isActive ? "active" : ""
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
                        ${isActive
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

              <div className={`dossier-wrapper focus-${currentStep} scale-[0.82] sm:scale-90 lg:scale-100`}>


                {/* =================================
                    PAPER 1
                ================================== */}

                <div
                  className="paper-sheet sheet-left p-5"
                  onClick={() => selectStep(1)}
                >
                  {/* Fejléc */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
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

                  <div className="mt-2.5 space-y-2">
                    {/* Cím */}
                    <div className="text-[13px] font-bold text-[#351F5B] leading-tight">
                      Válaszd ki az érettségi paramétereit
                    </div>

                    <div className="rounded-xl bg-slate-100 p-2 space-y-2">
                      {/* 1 · Tantárgy */}
                      <div>
                        <div className="text-[8px] font-semibold uppercase tracking-widest text-[#351F5B]/60 mb-1">
                          1 · Tantárgy
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white border-2 border-[#351F5B]/20 text-[11px] text-slate-800">
                          <span>Történelem</span>
                          <span
                            className="material-symbols-outlined text-slate-500"
                            style={{ fontSize: 14 }}
                          >
                            expand_more
                          </span>
                        </div>
                      </div>

                      {/* 2 · Szint */}
                      <div>
                        <div className="text-[8px] font-semibold uppercase tracking-widest text-[#351F5B]/60 mb-1">
                          2 · Szint
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="px-2 py-1.5 rounded-lg bg-[#351F5B]/5 border-2 border-[#351F5B] shadow-md shadow-[#351F5B]/10 text-[11px] font-bold text-slate-900">
                            Közép szint
                          </div>
                          <div className="px-2 py-1.5 rounded-lg bg-white border-2 border-transparent text-[11px] font-bold text-slate-900">
                            Emelt szint
                          </div>
                        </div>
                      </div>

                      {/* 3 · Évszám vagy témakör */}
                      <div>
                        <div className="text-[8px] font-semibold uppercase tracking-widest text-[#351F5B]/60 mb-1">
                          3 · Évszám vagy témakör
                        </div>
                        <div className="bg-white rounded-lg border border-[#351F5B]/20 p-1.5 space-y-1.5">
                          <div>
                            <div className="text-[9px] font-semibold text-slate-800 mb-0.5">
                              Évszám:
                            </div>
                            <div className="flex items-center justify-between px-2 py-1 rounded-md bg-white border-2 border-[#351F5B]/20 text-[10px] text-slate-800">
                              <span>2025</span>
                              <span
                                className="material-symbols-outlined text-slate-500"
                                style={{ fontSize: 14 }}
                              >
                                expand_more
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] font-semibold text-slate-800 mb-0.5">
                              Témakör:
                            </div>
                            <div className="flex items-center justify-between px-2 py-1 rounded-md bg-white border-2 border-[#351F5B]/20 text-[10px] text-slate-400">
                              <span>Válassz témakört</span>
                              <span
                                className="material-symbols-outlined text-slate-500"
                                style={{ fontSize: 14 }}
                              >
                                expand_more
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Indítás gomb */}
                    <div className="rounded-full bg-[#351F5B] text-white text-[11px] font-bold text-center py-2 shadow-lg shadow-[#351F5B]/30">
                      Gyakorlás indítása
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
                  {/* Fejléc */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-black tracking-wider text-[#351F5B] uppercase">
                        02. Gyakorlás
                      </span>
                    </div>

                    {/* Időzítő (mint a PracticePage-en) */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#351F5B] bg-white border border-[#4B2A7F]/20 px-2 py-0.5 rounded-full tabular-nums shadow-sm">
                      <span
                        className="material-symbols-outlined text-[#4B2A7F]"
                        style={{ fontSize: 12 }}
                      >
                        timer
                      </span>
                      12:46
                    </span>
                  </div>

                  {/* Kártya: bal forrás + jobb válasz */}
                  <div className="mt-2.5 rounded-lg border border-[#351F5B]/10 overflow-hidden flex shadow-sm">
                    {/* BAL OLDAL */}
                    <div className="w-[42%] bg-slate-50 p-2 flex flex-col">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                          3. feladat
                        </span>
                        <span className="p-0.5 bg-white rounded border border-[#351F5B]/10 text-[#351F5B] flex items-center">
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 10 }}
                          >
                            fullscreen
                          </span>
                        </span>
                      </div>

                      <div className="flex-1 rounded-md bg-white border border-slate-200 p-1.5 text-[8px] leading-snug text-slate-600">
                        <div className="font-bold text-slate-700 mb-0.5">Forrás</div>
                        „A haza nem a közjó előmozdítása nélkül lehet boldog…"
                        <div className="mt-1 h-1 rounded bg-slate-100" />
                        <div className="mt-1 h-1 w-4/5 rounded bg-slate-100" />
                        <div className="mt-1 h-1 w-3/5 rounded bg-slate-100" />
                      </div>
                    </div>

                    {/* JOBB OLDAL */}
                    <div className="w-[58%] p-2 flex flex-col">
                      <div className="inline-flex w-fit items-center px-1.5 py-0.5 rounded-full bg-[#351F5B]/10 text-[#351F5B] text-[8px] font-bold mb-1.5">
                        3 / 12
                      </div>

                      <div className="text-[10px] font-semibold leading-snug text-slate-800 mb-1.5">
                        Mikor jelent meg Széchenyi István „Hitel" című műve?
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="px-1.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[9px] text-slate-600">
                          A) 1825
                        </div>

                        <div className="px-1.5 py-1 rounded-md bg-[#351F5B]/5 border-2 border-[#351F5B] text-[9px] font-bold text-slate-900 flex items-center justify-between">
                          <span>B) 1830</span>
                          <span
                            className="material-symbols-outlined text-[#351F5B]"
                            style={{ fontSize: 11 }}
                          >
                            check
                          </span>
                        </div>

                        <div className="px-1.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[9px] text-slate-600">
                          C) 1841
                        </div>

                        <div className="px-1.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[9px] text-slate-600">
                          D) 1848
                        </div>
                      </div>

                      {/* Gombok */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="flex items-center gap-0.5 px-1.5 py-1 rounded-md bg-[#351F5B]/10 text-[#351F5B] text-[9px] font-semibold">
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 10 }}
                          >
                            arrow_back
                          </span>
                          Előző
                        </span>

                        <span className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-[#351F5B] text-white text-[9px] font-semibold shadow-md shadow-[#351F5B]/25">
                          Következő
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 10 }}
                          >
                            arrow_forward
                          </span>
                        </span>
                      </div>
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
                  {/* Fejléc (mint a ResultPage-en) */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <span className="text-[11px] font-black tracking-wider text-[#351F5B] uppercase">
                        03. Eredmény
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#351F5B] bg-[#351F5B]/10 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                        workspace_premium
                      </span>
                      Feladatsor befejezve
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2.5">
                    {/* Cím */}
                    <div>
                      <div className="text-[15px] font-bold tracking-tight text-[#24123D] leading-none">
                        Végeredmény
                      </div>
                      <div className="text-[10px] text-[#756B83] mt-1">
                        Történelem • 2025. május, középszint
                      </div>
                    </div>

                    {/* Statkártyák */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Összpontszám", value: "42 / 50", icon: "military_tech" },
                        { label: "Időtartam", value: "01:12:08", icon: "timer" },
                        { label: "Pontosság", value: "84%", icon: "target" },
                        { label: "XP", value: "90", icon: "leaderboard" },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="rounded-xl bg-[#F4F2F8] border border-[#351F5B]/10 p-2"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-medium text-[#756B83]">
                              {s.label}
                            </span>
                            <span
                              className="material-symbols-outlined text-[#4B2A7F]"
                              style={{ fontSize: 14 }}
                            >
                              {s.icon}
                            </span>
                          </div>
                          <div className="text-[13px] font-bold text-[#351F5B] leading-none">
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Témakörönkénti bontás */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Témakörönkénti bontás
                      </div>

                      {[
                        { nev: "Reformkor és szabadságharc", elert: 14, max: 15 },
                        { nev: "Világháborúk kora", elert: 12, max: 15 },
                        { nev: "Magyarország a 20. században", elert: 16, max: 20 },
                      ].map((t) => {
                        const percent = Math.round((t.elert / t.max) * 100);
                        return (
                          <div key={t.nev}>
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-[10px] font-semibold text-[#35284B] truncate">
                                {t.nev}
                              </span>
                              <span className="text-[9px] font-medium text-[#756B83] whitespace-nowrap">
                                {t.elert}/{t.max} pont · {percent}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#F0EDF5] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#351F5B] to-[#7654A5] rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
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