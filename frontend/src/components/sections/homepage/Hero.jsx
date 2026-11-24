import TudasterIntro from "../../../assets/tudaster-logo-transparent.webm";
import TudasterIntro2 from "../../../assets/tudaster-logo-transparent-prores-kicsi.mov";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

function Hero() {

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();

        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const isSafari = () => {
        if (typeof navigator === 'undefined') return false;
        const ua = navigator.userAgent;
        return /^((?!chrome|chromium|android|crios|fxios|edgios|edg).)*safari/i.test(ua);
    };
    const introSrc = useMemo(() => (isSafari() ? TudasterIntro2 : TudasterIntro), []);


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


                    <div className="order-2 w-full lg:order-1 lg:w-[72%] lg:-ml-20">
                        <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl">
                            <div className="aspect-video w-full overflow-hidden relative">
                                <video
                                    key={introSrc}
                                    src={introSrc}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="absolute left-0 top-1/2 h-[135%] w-full -translate-y-1/2 object-cover transition-transform duration-500"
                                />
                            </div>
                        </div>
                    </div>


                    {/* ======================================== */}
                    {/* JOBB OLDAL - HERO SZÖVEG */}
                    {/* ======================================== */}

                    <div className="order-1 flex max-w-xl flex-col items-start text-left lg:order-2 lg:w-[38%] lg:max-w-none">

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
                            <Link
                                to="/tasktype"
                                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#200646] px-6 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-[#351f5b]/20 transition-all duration-150 hover:scale-[1.01] hover:bg-[#351f5b] hover:shadow-xl sm:w-auto"
                            >
                                <span>
                                    Gyakorlás indítása
                                </span>

                                <span className="material-symbols-outlined text-[18px]">
                                    arrow_forward
                                </span>
                            </Link>



                        </div>

                        

                    </div>

                </div>

            </div>

        </section>
    );
}

export default Hero;
