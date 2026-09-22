import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from  '../../lib/apiClient';

function TaskSelection() {
    // =========================
    // ÁLLAPOTOK
    // =========================
    const navigate = useNavigate();

    const [subjects, setSubjects] = useState([]);
    const [levels, setLevels] = useState([]);
    const [years, setYears] = useState([]);
    const [topics, setTopics] = useState([]);

    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    // =========================
    // ADATOK BETÖLTÉSE
    // =========================

    useEffect(() => {

        const loadSubjects = async () => {
            try {
                setLoading(true);
                const data = await apiFetch('/taskroutes/subjects');
                setSubjects(data);
            } catch (err) {
                setError("Nem sikerült betölteni az adatokat.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadSubjects();


    }, []);

    const LEVEL_LABELS = {
        kozep: 'Közép szint',
        emelt: 'Emelt szint',
    };

    useEffect(() => {
        if (!selectedSubject) {
            setLevels([]);
            setYears([]);
            setTopics([]);
            return;
        }

        const loadDependentData = async () => {
            try {
                const [levelData, yearData, topicData] = await Promise.all([
                    apiFetch(`/taskroutes/level?tantargy_id=${selectedSubject}`),
                    apiFetch(`/taskroutes/year?tantargy_id=${selectedSubject}`),
                    apiFetch(`/taskroutes/topics?tantargy_id=${selectedSubject}`),
                ]);

                const formattedLevels = levelData.map((item) => ({
                    id: item.szint,
                    value: item.szint,
                    name: LEVEL_LABELS[item.szint] ?? item.szint,
                }));

                setLevels(formattedLevels);
                setYears(yearData);
                setTopics(topicData);
            } catch (err) {
                setError("Nem sikerült betölteni a tantárgyhoz tartozó adatokat.");
                console.error(err);
            }
        };

        loadDependentData();
    }, [selectedSubject]);


    // =========================
    // KIVÁLASZTÁSOK
    // =========================

    


    const handleLevelSelect = (level) => {
        setSelectedLevel(level);
    };


    const handleYearChange = (e) => {
        const value = e.target.value;

        setSelectedYear(value);

        // Ha évet választott, töröljük a témakört
        if (value) {
            setSelectedTopic("");
        }
    };


    const handleTopicChange = (e) => {
        const value = e.target.value;

        setSelectedTopic(value);

        // Ha témakört választott, töröljük az évet
        if (value) {
            setSelectedYear("");
        }
    };


    // =========================
    // INDÍTÁS
    // =========================

    const isReady =
        selectedSubject &&
        selectedLevel &&
        (selectedYear || selectedTopic);


    const handleStart = () => {
        if (!isReady) return;

        const params = new URLSearchParams({
            subject: selectedSubject,
            level: selectedLevel,
        });

        if (selectedYear) params.set('year', selectedYear);
        if (selectedTopic) params.set('topic', selectedTopic);

        navigate(`/practice?${params.toString()}`);
    };


    // =========================
    // LOADING / ERROR
    // =========================

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-backgroundLight">
                <p className="text-primary font-semibold">
                    Betöltés...
                </p>
            </div>
        );
    }


    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-backgroundLight">
                <p className="text-red-500 font-semibold">
                    {error}
                </p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-backgroundLight overflow-hidden">

            {/* Négyzetrács */}
            <div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                    backgroundImage: `
                linear-gradient(to right, rgba(53,31,91,0.06) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(53,31,91,0.06) 1px, transparent 1px)
            `,
                    backgroundSize: "40px 40px",
                }}
            />
            
            <main className="max-w-7xl mx-auto px-6 py-50">


                {/* FEJLÉC */}

                <header className="text-center mb-14">

                    <h1 className="text-4xl font-bold text-primary mb-4">
                        Válaszd ki az érettségi paramétereit
                    </h1>

                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Állítsd össze a gyakorló feladatsort a tárgy, a szint és az évszám vagy témakör kiválasztásával.
                    </p>

                </header>


                {/* =========================
                    PARAMÉTEREK
                ========================= */}

                <div className="relative z-10 bg-slate-100 rounded-3xl p-8 lg:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">


                        {/* =========================
                        TANTÁRGY
                    ========================= */}

                        <section className="lg:col-span-5 space-y-6">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary/60">
                                1 · Tantárgy
                            </h2>

                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full p-3 border-2 border-primary/20 rounded-xl bg-white"
                            >
                                <option value="">Válassz tantárgyat</option>

                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.nev}
                                    </option>
                                ))}
                            </select>
                        </section>


                        {/* =========================
                        SZINT
                    ========================= */}

                        <section className="lg:col-span-3 space-y-6">

                            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary/60">
                                2 · Szint
                            </h2>


                            <div className="space-y-4">

                                {levels.map((level) => (

                                    <button
                                        key={level.id}
                                        type="button"
                                        onClick={() =>
                                            handleLevelSelect(level.value)
                                        }
                                        className={`
                                        w-full
                                        text-left
                                        p-6
                                        bg-white
                                        border-2
                                        rounded-2xl
                                        transition-all
                                        duration-200
                                        ${selectedLevel === level.value
                                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                                : "border-transparent hover:border-primary/20 hover:shadow-md"
                                            }
                                    `}
                                    >

                                        <h3 className="font-bold text-lg">
                                            {level.name}
                                        </h3>

                                    </button>

                                ))}

                            </div>

                        </section>


                        {/* =========================
                        ÉVSZÁM / TÉMAKÖR
                    ========================= */}

                        <section className="lg:col-span-4 space-y-6">

                            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary/60">
                                3 · Évszám vagy témakör
                            </h2>


                            <div className="bg-white rounded-2xl border border-primary/20 overflow-hidden shadow-lg shadow-primary/5 p-4">


                                {/* ÉVSZÁM */}

                                <label
                                    htmlFor="yearSelect"
                                    className="font-semibold mb-2 block"
                                >
                                    Évszám:
                                </label>


                                <select
                                    id="yearSelect"
                                    value={selectedYear}
                                    onChange={handleYearChange}
                                    className="w-full p-3 border-2 border-primary/20 rounded-xl bg-white text-slate-800 mb-5"
                                >

                                    <option value="">
                                        Válassz évszámot
                                    </option>


                                    {years.map((year) => (

                                        <option
                                            key={year.id}
                                            value={year.ev}
                                        >
                                            {year.ev}
                                        </option>

                                    ))}

                                </select>


                                {/* TÉMAKÖR */}

                                <label
                                    htmlFor="topicSelect"
                                    className="font-semibold mb-2 block"
                                >
                                    Témakör:
                                </label>


                                <select
                                    id="topicSelect"
                                    value={selectedTopic}
                                    onChange={handleTopicChange}
                                    className="w-full p-3 border-2 border-primary/20 rounded-xl bg-white text-slate-800"
                                >

                                    <option value="">
                                        Válassz témakört
                                    </option>


                                    {topics.map((topic) => (

                                        <option
                                            key={topic.id}
                                            value={topic.id}
                                        >
                                            {topic.nev}
                                        </option>

                                    ))}

                                </select>

                            </div>

                        </section>

                    </div>
                </div>


                {/* =========================
                    INDÍTÁS
                ========================= */}

                <div className="mt-20 text-center">

                    <button
                        id="startBtn"
                        type="button"
                        disabled={!isReady}
                        onClick={handleStart}
                        className={`
                            px-14
                            py-6
                            rounded-full
                            text-lg
                            font-bold
                            transition-all
                            duration-200
                            ${isReady
                                ? "bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-105 cursor-pointer"
                                : "bg-primary text-white opacity-50 cursor-not-allowed"
                            }
                        `}
                    >
                        Gyakorlás indítása
                    </button>

                </div>

            </main>

        </div>
    );
}

export default TaskSelection;