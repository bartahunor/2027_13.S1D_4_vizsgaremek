import TudasterIntro from "../../assets/Tudaster-intro.mp4";
import { useState } from "react";


function Hero() {

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();

        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };


    return (
        <section
            onMouseMove={handleMouseMove}
            className="relative overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-white pt-12 pb-20 md:pt-16 md:pb-28"
        >

            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-100"></div>

            {/* Egér körüli lila fény */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(
            circle 100px at ${mousePosition.x}px ${mousePosition.y}px,
            rgba(124, 58, 237, 0.19),
            rgba(124, 58, 237, 0.1) 35%,
            transparent 65%
        )`,
                    maskImage: `
            linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%),
            linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)
        `,
                    WebkitMaskImage: `
            linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%),
            linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)
        `,
                    maskComposite: "intersect",
                    WebkitMaskComposite: "source-in",
                }}
            ></div>

            {/* Háttér - lila fény */}
            <div className="pointer-events-none absolute top-0 left-1/2 h-[450px] w-[900px] -translate-x-1/2 bg-gradient-to-b from-primary-fixed/60 via-secondary-fixed/40 to-transparent blur-3xl"></div>

            {/* Fő konténer */}
            <div className="relative z-10 mx-auto max-w-[1240px] px-6 py-8">

                <div className="grid grid-cols-1 items-center gap-10 lg:flex lg:justify-between lg:gap-14">


                    {/* ======================================== */}
                    {/* BAL OLDAL - KÉP / VIDEÓ */}
                    {/* ======================================== */}

                    <div className="order-2 w-full max-w-xl flex-1 lg:order-1 lg:max-w-2xl">

                        <div className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl md:rounded-3xl">

                            {/* VIDEÓ */}
                            <div className="aspect-[4/3] w-full overflow-hidden">

                                <video
                                    src={TudasterIntro}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                />

                            </div>

                            {/* Alsó információs sáv */}
                            <div className="absolute right-4 bottom-4 left-4 ...">
                                ...
                            </div>

                        </div>

                    </div>


                    {/* ======================================== */}
                    {/* JOBB OLDAL - HERO SZÖVEG */}
                    {/* ======================================== */}

                    <div className="order-1 flex max-w-xl flex-1 flex-col items-start text-left lg:order-2">

                        {/* ======================================== */}
                        {/* FŐCÍM */}
                        {/* ======================================== */}

                        <h1 className="mb-5 text-3xl font-extrabold leading-[1.15] tracking-tight text-[#200646] sm:text-4xl md:text-5xl">

                            Gyakorlás.{" "}

                            <span className="text-secondary">
                                Fejlődés.
                            </span>{" "}

                            Sikeres érettségi.

                        </h1>


                        {/* LEÍRÁS */}

                        <p className="mb-6 text-base font-normal leading-relaxed text-slate-600 sm:text-lg">

                            Gyakorolj valódi érettségi feladatokon, értsd meg a hibáidat, és kövesd a fejlődésedet egy helyen. A Tudástér segít abban, hogy célzottan készülj, magabiztosabban vizsgázz, és kihozd magadból a legtöbbet.


                        </p>


                        {/* ======================================== */}
                        {/* GOMBOK */}
                        {/* ======================================== */}

                        <div className="mb-5 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">

                            {/* Fő CTA */}
                            <a
                                href="#"
                                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#200646] px-6 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-[#351f5b]/20 transition-all duration-150 hover:scale-[1.01] hover:bg-[#351f5b] hover:shadow-xl sm:w-auto"
                            >

                               

                                <span>
                                    Gyakorlás indítása 
                                </span>

                                <span className="material-symbols-outlined text-[18px]">
                                    arrow_forward
                                </span>

                            </a>


                            
                        </div>

                        {/* ======================================== */}
                        {/* AKTÍV DIÁKOK */}
                        {/* ======================================== */}

                        <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-xs text-slate-600 shadow-2xs">

                            {/* Avatarok */}
                            <div className="flex -space-x-2">

                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-purple-100 text-[11px] font-bold text-[#200646] ring-1 ring-slate-100">
                                    ÁB
                                </span>

                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-[11px] font-bold text-emerald-700 ring-1 ring-slate-100">
                                    KN
                                </span>

                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[11px] font-bold text-secondary ring-1 ring-slate-100">
                                    PT
                                </span>

                            </div>


                            {/* Aktív felhasználók */}
                            <div className="flex items-center gap-2">

                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>

                                <span className="font-medium text-slate-700">
                                    1 420 diák gyakorol épp most országosan
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </section>
    );
}

export default Hero;
