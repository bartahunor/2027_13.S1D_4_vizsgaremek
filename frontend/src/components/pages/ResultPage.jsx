
import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { apiFetch } from "../../lib/apiClient";
import TaskCard from "../ui/CorrectedTaskCard";

const getStatus = (question) => {
    if (question.elert_pont === question.max_pont) return "correct";
    if (question.elert_pont === 0) return "incorrect";
    return "partial";
};

function formatIdotartam(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0))

  const hours = Math.floor(sec / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const seconds = sec % 60

  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}


export const calcTestXp = (test) => {
    const XP_BAND_SIZE = 10;
    const XP_PER_BAND = 10;

    if (!test.max_pont) return 0;

    const percent = Math.round((test.elert_pont / test.max_pont) * 100);
    const band = Math.max(1, Math.ceil(percent / XP_BAND_SIZE)); // a 0% is az 1. sáv
    return band * XP_PER_BAND;
};


function ResultPage() {
    const [filter, setFilter] = useState("all");
    const [expandedQuestions, setExpandedQuestions] = useState([]);

    const [osszesito, setOsszesito] = useState(null);
    const [feladatok, setFeladatok] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { state } = useLocation();

    

    // ha valaki közvetlenül, állapot nélkül nyitja meg az oldalt
    if (!state?.result) {
        return <Navigate to="/" replace />;
    }

    const { result } = state;
    console.log(result)

    

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                // a két API párhuzamosan hívódik meg
                const [osszesitoRes, feladatokRes] = await Promise.all([
                    apiFetch(`/correctionroutes/result/${result.teszt_id}`),
                    apiFetch(`/correctionroutes/correctedtasks/${result.teszt_id}`),
                ]);

                if (cancelled) return;

                setOsszesito(osszesitoRes);
                setFeladatok(feladatokRes.feladatok);
                console.log(osszesitoRes)
                console.log(feladatokRes.feladatok)
            } catch (err) {
                if (cancelled) return;
                console.error("Eredmény lekérési hiba:", err);
                setError("Nem sikerült betölteni az eredményt.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadData();

        // cleanup: ha az oldal elhagyásakor még fut a kérés, ne állítson state-et
        return () => {
            cancelled = true;
        };
    }, [result]);

    if (loading) return <p>Betöltés...</p>;
    if (error) return <p>{error}</p>;
    if (!osszesito) return null;



    /*
    const filteredQuestions = questions.filter((question) => {
        if (filter === "incorrect") {
            return getStatus(question) !== "correct";
        }
        return true;
    });*/

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
            value: `${osszesito.elert_pont} / ${osszesito.max_pont}`,
            icon: "military_tech",
            description: `${osszesito.szazalek}% teljesítmény`,
        },
        {
            label: "Időtartam",
            value: formatIdotartam(osszesito.idotartam_masodperc),
            icon: "timer",
            description: "A feladatsor kitöltési ideje",
        },
        {
            label: "Pontosság",
            value: `${osszesito.szazalek}%`,
            icon: "target",
            description: "Elért pontosság",
        },
        {
            label: "XP",
            value: calcTestXp(osszesito),
            icon: "leaderboard",
            description: `A megszerezhető 100 XP-ből`,
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
                                {osszesito.teszt.tantargy}  •  {osszesito.teszt.nev}
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
                                    {osszesito.elert_pont} pont
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
                            {osszesito.temakorok.map((topic) => {
                                const percent = Math.round(
                                    (topic.elert_pont / topic.max_pont) * 100
                                );

                                return (
                                    <div key={topic.nev}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                                            <span className="font-semibold text-[#35284B]">
                                                {topic.nev}
                                            </span>
                                            <span className="text-sm font-medium text-[#756B83]">
                                                {topic.elert_pont}/{topic.max_pont} pont · {percent}%
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
                        {/*
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
                        */}
                        </div>
                    </div>


                    {feladatok.map((question, index) => {
                        const status = getStatus(question);

                        return (
                            <TaskCard
                                key={question.feladat_id}
                                question={question}
                                number={index + 1}
                                status={status}
                                expandable={status !== "correct"}
                                expanded={expandedQuestions.includes(question.feladat_id)}
                                onToggleExplanation={() => toggleExplanation(question.feladat_id)}
                            />
                        );
                    })}
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
