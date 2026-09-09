import { useEffect, useRef, useState } from "react";
import TestimonialCard from "../ui/TestimonialCard";

function TestimonialSection() {
    const texts = [
        {
            initials: "KA",
            name: "Kovács Anna",
            title: "Budapest, ELTE hallgató",
            testimonial: `"Legjobb döntés volt az érettségi előtt! A magyarázatok sokkal érthetőbbek, mint a tankönyvben. Sikerült a töri érettségi ötösre!"`
        },
        {
            initials: "BT",
            name: "Balla Tamás",
            title: "Debrecen, Egyetemi hallgató",
            testimonial: `"A funkciók tesznek nagyon sokat segítenek a tanulásban az érettségire. Különösen az eszközök tippek jönnek be!"`
        },
        {
            initials: "SL",
            name: "Szabó Luca",
            title: "Szeged, Orvosi egyetem",
            testimonial: `"Imádom, hogy bárhonnan tudom tanulni mobilon is. A rangsor pedig motivált, hogy minden nap fejlődjek."`
        }
    ];

    const sectionRef = useRef(null);
    const [hasEntered, setHasEntered] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [reducedMotion, setReducedMotion] = useState(false);

    // prefers-reduced-motion figyelése
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReducedMotion(mediaQuery.matches);

        const handler = (e) => setReducedMotion(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    // Belépési animáció indítása — csak egyszer, amikor a szekció kb. 35%-a látszik
    useEffect(() => {
        const node = sectionRef.current;
        if (!node || hasEntered) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
                        setHasEntered(true);
                        setActiveIndex(0);
                        observer.disconnect();
                    }
                });
            },
            { threshold: [0, 0.35, 1] }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasEntered]);

    // Egy kártya animációja befejeződött -> következő indul
    const handleCardComplete = (index) => {
        setActiveIndex((prev) => (index === prev ? prev + 1 : prev));
    };

    return (
        <section
            ref={sectionRef}
            className="py-50 px-4 bg-secondary"
            data-purpose="user-testimonials"
            id="testimonials"
        >
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">

                    <div className="relative group cursor-pointer">

                        {/* Bal felső lila fény */}
                        <div
                            className="
                                absolute
                                -top-16
                                -left-16
                                w-100
                                h-100
                                rounded-full
                                bg-violet-500/20
                                blur-[100px]
                                pointer-events-none
                                z-0
                            "
                        />

                        <div className="bg-white rounded-3xl h-full flex items-center justify-center overflow-hidden shadow-2xl relative z-10">

                            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-xl z-10 group-hover:scale-110 transition-transform">
                                <svg
                                    className="w-10 h-10 text-white ml-1"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M8 5v14l11-7z"></path>
                                </svg>
                            </div>

                        </div>
                    </div>

                    <div className="relative testimonial-scroll flex flex-col gap-6">

                        {/* Halvány fény a kommentek mögött */}
                        <div
                            className="
                                absolute
                                top-1/2
                                left-1/2
                                -translate-x-1/2
                                -translate-y-1/2
                                w-[100%]
                                h-[100%]
                                rounded-full
                                bg-violet-500/20
                                blur-[110px]
                                pointer-events-none
                            "
                        />

                        {/* Komment kártyák */}
                        <div className="relative z-10 flex flex-col gap-6">
                            {texts.map((text, index) => (
                                <TestimonialCard
                                    key={index}
                                    initals={text.initials}
                                    name={text.name}
                                    title={text.title}
                                    testimonial={text.testimonial}
                                    startAnimation={index <= activeIndex}
                                    onComplete={() => handleCardComplete(index)}
                                    reducedMotion={reducedMotion}
                                />
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}

export default TestimonialSection;