
import { useState } from "react";
import TaskCard from "../ui/CorrectedTaskCard";

const mockResult = {
    subject: "Matematika",
    level: "Emelt szint",
    year: "2025",
    totalPoints: 82,
    maxPoints: 100,
    duration:  "01:24:36",
    accuracy: 82,
    placement:  "12. hely",
    participants: 156,
};

const topicResults = [
    { name: "Algebra", earned: 22, max: 25 },
    { name: "Geometria", earned: 18, max: 25 },
    { name: "Valószínűségszámítás", earned: 24, max: 25 },
    { name: "Függvénytan", earned: 18, max: 25 },
];

const questions = [
    {
        id: 1,
        title: "Másodfokú egyenletek",
        topic: "Algebra",
        question: "Oldja meg a következő egyenletet a valós számok halmazán: 2x² - 5x + 2 = 0.",
        userAnswer: "x₁ = 2, x₂ = 0,5",
        correctAnswer: "x₁ = 2, x₂ = 0,5",
        earned: 4,
        max: 4,
        explanation: [
            "Az egyenletet nullára rendezett másodfokú egyenletként kezeljük.",
            "A megoldóképlet alkalmazásával meghatározzuk a gyököket.",
            "A két megoldás: x₁ = 2 és x₂ = 0,5.",
        ],
    },
    {
        id: 2,
        title: "Geometriai sorozatok",
        topic: "Geometria",
        question: "Egy mértani sorozat első tagja 3, a hányadosa 2. Mennyi az első tíz tag összege?",
        userAnswer: "1536",
        correctAnswer: "3069",
        earned: 0,
        max: 6,
        explanation: [
            "Azonosítsuk az adatokat: a₁ = 3, q = 2, n = 10.",
            "Alkalmazzuk a mértani sorozat összegképletét: Sₙ = a₁ · (qⁿ - 1) / (q - 1).",
            "Helyettesítsünk be: S₁₀ = 3 · (2¹⁰ - 1) / (2 - 1).",
            "Az eredmény: 3069.",
        ],
    },
    {
        id: 3,
        title: "Trigonometrikus függvények",
        topic: "Függvénytan",
        question: "Adja meg a sin(x) = 0,5 egyenlet megoldásait a [0, 2π] intervallumon.",
        userAnswer: "x = π/6",
        correctAnswer: "x₁ = π/6, x₂ = 5π/6",
        earned: 3,
        max: 5,
        explanation: [
            "Keressük meg azokat a szögeket, amelyek szinusza 0,5.",
            "Az első megoldás π/6.",
            "A második megoldás 5π/6.",
        ],
    },
];

const getStatus = (question) => {
    if (question.earned === question.max) return "correct";
    if (question.earned === 0) return "incorrect";
    return "partial";
};

const statusConfig = {
    correct: {
        label: "Helyes",
        icon: "check_circle",
        color: "text-emerald-700",
        badge: "bg-emerald-50 border-emerald-200",
        border: "border-emerald-500",
    },
    incorrect: {
        label: "Hibás",
        icon: "cancel",
        color: "text-red-700",
        badge: "bg-red-50 border-red-200",
        border: "border-red-500",
    },
    partial: {
        label: "Részben helyes",
        icon: "warning",
        color: "text-amber-700",
        badge: "bg-amber-50 border-amber-200",
        border: "border-amber-500",
    },
};

function ResultPage() {
    const [filter, setFilter] = useState("all");
    const [expandedQuestions, setExpandedQuestions] = useState([2]);

    const percentage = Math.round(
        (mockResult.totalPoints / mockResult.maxPoints) * 100
    );

    const filteredQuestions = questions.filter((question) => {
        if (filter === "incorrect") {
            return getStatus(question) !== "correct";
        }
        return true;
    });

    const toggleExplanation = (id) => {
        setExpandedQuestions((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    const stats = [
        {
            label: "Összpontszám",
            value: `${mockResult.totalPoints} / ${mockResult.maxPoints}`,
            icon: "military_tech",
            description: `${percentage}% teljesítmény`,
        },
        {
            label: "Időtartam",
            value: mockResult.duration,
            icon: "timer",
            description: "A feladatsor kitöltési ideje",
        },
        {
            label: "Pontosság",
            value: `${mockResult.accuracy}%`,
            icon: "target",
            description: "Elért pontosság",
        },
        {
            label: "XP",
            value: mockResult.placement,
            icon: "leaderboard",
            description: `${mockResult.participants} résztvevő közül`,
        },
    ];

    return (
        <div className="min-h-screen bg-[#F4F2F8] text-[#24123D] font-display">
            <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 pt-28">

                {/* FEJLÉC */}
                <div className="mb-9">
                    

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#351F5B]/10 text-[#351F5B] px-3 py-1 text-xs font-bold mb-3">
                                <span className="material-symbols-outlined text-sm">
                                    workspace_premium
                                </span>
                                Feladatsor befejezve
                            </span>

                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                Végeredmény
                            </h1>

                            <p className="text-[#756B83] mt-2">
                                {mockResult.year}. évi {mockResult.subject.toLowerCase()} érettségi · {mockResult.level} Teszt név
                            </p>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl bg-white border border-[#351F5B]/10 px-5 py-3 shadow-sm">
                            <div className="w-11 h-11 rounded-xl bg-[#351F5B]/10 flex items-center justify-center text-[#351F5B]">
                                <span className="material-symbols-outlined">
                                    emoji_events
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-[#756B83]">
                                    Elért eredmény
                                </p>
                                <p className="font-bold text-[#351F5B]">
                                    {mockResult.totalPoints} pont
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EREDMÉNYKÁRTYÁK */}
                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-white rounded-2xl border border-[#351F5B]/10 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <span className="text-sm font-medium text-[#756B83]">
                                    {stat.label}
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-[#351F5B]/10 flex items-center justify-center text-[#4B2A7F]">
                                    <span className="material-symbols-outlined">
                                        {stat.icon}
                                    </span>
                                </div>
                            </div>

                            <p className="text-2xl font-bold text-[#351F5B]">
                                {stat.value}
                            </p>
                            <p className="text-xs text-[#8A8196] mt-2">
                                {stat.description}
                            </p>
                        </div>
                    ))}
                </section>

                {/* TÉMAKÖRÖK */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-[#351F5B]/10 flex items-center justify-center text-[#4B2A7F]">
                            <span className="material-symbols-outlined">
                                insights
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold">
                                Témakörönkénti bontás
                            </h2>
                            <p className="text-sm text-[#756B83]">
                                Az eredményed részletes áttekintése
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#351F5B]/10 p-5 sm:p-7 shadow-sm">
                        <div className="space-y-7">
                            {topicResults.map((topic) => {
                                const percent = Math.round(
                                    (topic.earned / topic.max) * 100
                                );

                                return (
                                    <div key={topic.name}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                                            <span className="font-semibold text-[#35284B]">
                                                {topic.name}
                                            </span>
                                            <span className="text-sm font-medium text-[#756B83]">
                                                {topic.earned}/{topic.max} pont · {percent}%
                                            </span>
                                        </div>

                                        <div className="w-full h-3 bg-[#F0EDF5] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#351F5B] to-[#7654A5] rounded-full transition-all duration-1000"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* FELADATOK ÁTTEKINTÉSE */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold">
                                Kérdések áttekintése
                            </h2>
                            <p className="text-sm text-[#756B83] mt-1">
                                Nézd át a válaszaidat és a javításokat
                            </p>
                        </div>

                        <div className="flex items-center gap-1 p-1 bg-[#EAE5F1] rounded-xl w-fit">
                            <button
                                onClick={() => setFilter("all")}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    filter === "all"
                                        ? "bg-white text-[#351F5B] shadow-sm"
                                        : "text-[#756B83] hover:text-[#351F5B]"
                                }`}
                            >
                                Összes ({questions.length})
                            </button>

                            <button
                                onClick={() => setFilter("incorrect")}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    filter === "incorrect"
                                        ? "bg-white text-[#351F5B] shadow-sm"
                                        : "text-[#756B83] hover:text-[#351F5B]"
                                }`}
                            >
                                Hibák ({questions.filter(q => getStatus(q) !== "correct").length})
                            </button>
                        </div>
                    </div>

                    <TaskCard />

                    
                </section>

                {/* ALSÓ SEGÍTSÉG BLOKK */}
                <section className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#351F5B] to-[#24123D] p-7 sm:p-9 shadow-xl shadow-[#351F5B]/15">
                    <div className="absolute -right-8 -bottom-16 opacity-10 pointer-events-none">
                        <span className="material-symbols-outlined text-[190px] text-white">
                            school
                        </span>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-white text-xl sm:text-2xl font-bold mb-2">
                                Fejleszd tovább a tudásod!
                            </h3>
                            <p className="text-white/70 text-sm max-w-lg leading-relaxed">
                                Nézd át a hibás válaszaidat, gyakorolj tovább, és készülj fel magabiztosan az érettségire.
                            </p>
                        </div>

                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center gap-2 bg-white text-[#351F5B] font-bold px-6 py-3 rounded-xl hover:bg-[#F0EDF5] transition-colors whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined text-lg">
                                arrow_back
                            </span>
                            Vissza a gyakorláshoz
                        </button>
                    </div>
                </section>

            </main>
        </div>
    );
}

export default ResultPage;
