import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../lib/apiClient';
import { getForrasKepUrl } from '../../lib/supabaseStorage';

function PracticePage() {

    const [searchParams] = useSearchParams();

    const subject = searchParams.get('subject');
    const level = searchParams.get('level');
    const year = searchParams.get('year');   // null, ha nincs beállítva
    const topic = searchParams.get('topic'); // null, ha nincs beállítva

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //Fruzsi
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [answer, setAnswer] = useState("");


    useEffect(() => {
        const loadTasks = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    tantargy_id: subject,
                    szint: level,
                });

                if (year) params.set('ev', year);
                else if (topic) params.set('temakor_id', topic);

                const data = await apiFetch(`/taskroutes/chosentasks?${params.toString()}`);

                const tasksWithImages = await Promise.all(
                    data.map(async (task) => ({
                        ...task,
                        forras_kep_url: await getForrasKepUrl(task.forras_kep),
                    }))
                );

                setTasks(tasksWithImages);
                setCurrentTaskIndex(0);
                console.log('Beérkezett adat:', tasksWithImages);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (subject && level && (year || topic)) {
            loadTasks();
        }
    }, [subject, level, year, topic]);

    if (loading) return <div>Betöltés...</div>;
    if (error) return <div>Hiba történt: {error}</div>;

    if (tasks.length === 0) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="text-center">
                    <span className="material-icons text-primary text-4xl">
                        assignment
                    </span>

                    <h2 className="text-lg font-semibold mt-3">
                        Nincsenek feladatok
                    </h2>

                    <p className="text-sm text-slate-500 mt-2">
                        A kiválasztott feltételekhez nem található feladat.
                    </p>
                </div>
            </div>
        );
    }
    const currentTask = tasks[currentTaskIndex];

    const currentNumber = currentTaskIndex + 1;

    const totalTasks = tasks.length;

    const progress = (currentNumber / totalTasks) * 100;

    const handlePrevious = () => {
        if (currentTaskIndex > 0) {
            setCurrentTaskIndex((prev) => prev - 1);
            setAnswer("");
        }
    };

    const handleNext = () => {
        if (currentTaskIndex < totalTasks - 1) {
            setCurrentTaskIndex((prev) => prev + 1);
            setAnswer("");
        }
    };

    const handleFullscreen = () => {
        const element = document.getElementById("source-material");

        if (element?.requestFullscreen) {
            element.requestFullscreen();
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background-light text-slate-900 font-display relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-100"></div>


            {/* Haladási sáv */}
            <div className="fixed top-0 left-0 w-full h-1.5 bg-primary/10 z-50">
                <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                        width: `${progress}%`,
                    }}
                />
            </div>


            {/* HEADER */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-primary/10 z-40">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">

                        <div className="w-10 h-10 shrink-0 bg-primary rounded-lg flex items-center justify-center text-white">
                            <span className="material-icons">
                                school
                            </span>
                        </div>

                        <div className="min-w-0">

                            <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">
                                {subject}
                            </h1>

                            <p className="text-[10px] sm:text-xs text-primary/60 font-medium uppercase tracking-wider truncate">
                                {year
                                    ? `${year} • ${level}`
                                    : `${topic} • ${level}`
                                }
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="
                        text-xs sm:text-sm
                        font-semibold
                        text-primary/70
                        hover:text-primary
                        transition-colors
                        px-3 sm:px-4
                        py-2
                        rounded-lg
                        border border-transparent
                        hover:border-primary/20
                    "
                    >
                        Vizsga befejezése
                    </button>

                </div>

            </header>


            {/* FŐ TARTALOM */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-6 md:p-12">

                <div
                    className="
                    max-w-7xl
                    w-full
                    bg-white
                    rounded-xl
                    shadow-2xl
                    shadow-primary/5
                    border border-primary/10
                    overflow-hidden
                    flex flex-col
                    md:flex-row
                    min-h-[750px]
                "
                >


                    {/* BAL OLDAL */}
                    <div
                        className="
                        w-full
                        md:w-1/2
                        bg-slate-50
                        p-5 sm:p-8
                        flex flex-col
                    "
                    >

                        <div className="flex items-center justify-between mb-4">

                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {currentNumber}. feladat
                            </span>

                            <button
                                type="button"
                                onClick={handleFullscreen}
                                className="
                                p-2
                                bg-white
                                rounded-lg
                                shadow-sm
                                border border-primary/5
                                text-primary
                                hover:bg-primary
                                hover:text-white
                                transition-all
                            "
                            >
                                <span className="material-icons text-sm">
                                    fullscreen
                                </span>
                            </button>

                        </div>


                        {/* FORRÁSANYAG */}
                        <div
                            id="source-material"
                            className="
                            flex-grow
                            min-h-[300px]
                            rounded-xl
                            overflow-hidden
                            border border-primary/10
                            bg-white
                        "
                        >

                            {currentTask.forras_kep_url ? (

                                <img
                                    src={currentTask.forras_kep_url}
                                    alt="Forrásanyag"
                                    className="w-full h-full object-contain p-2"
                                />

                            ) : (

                                <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
                                    Nincs forrásanyag
                                </div>

                            )}

                        </div>


                        {currentTask.forras_magyarazat && (
                            <p className="mt-4 text-xs text-slate-500 italic">
                                {currentTask.forras_magyarazat}
                            </p>
                        )}

                    </div>


                    {/* JOBB OLDAL */}
                    <div
                        className="
                        w-full
                        md:w-1/2
                        p-5 sm:p-8 md:p-12
                        flex flex-col
                    "
                    >

                        <div className="mb-6 sm:mb-8">

                            <div className="
                            inline-flex
                            items-center
                            px-3
                            py-1
                            rounded-full
                            bg-primary/10
                            text-primary
                            text-xs
                            font-bold
                            mb-4
                        ">
                                {currentNumber} / {totalTasks}
                            </div>


                            <h2 className="text-xl sm:text-2xl font-semibold leading-snug">
                                {currentTask.feladat_szoveg ||
                                    currentTask.kerdes ||
                                    currentTask.kerdes_szoveg}
                            </h2>

                        </div>


                        {/* FELADAT */}
                        <div className="flex-grow space-y-4 overflow-y-auto pr-2 p-3">

                            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">

                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">
                                    Feladat típusa
                                </p>

                                <p className="text-sm font-medium text-primary">
                                    {currentTask.feladat_tipus || "Feladat"}
                                </p>

                            </div>


                            {/* VÁLASZ */}
                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Válasz
                                </label>

                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Írd ide a válaszodat..."
                                    className="
                                    w-full
                                    min-h-[160px]
                                    resize-none
                                    rounded-xl
                                    border border-slate-200
                                    p-4
                                    text-sm
                                    outline-none
                                    focus:border-primary
                                    focus:ring-4
                                    focus:ring-primary/10
                                "
                                />

                            </div>

                        </div>


                        {/* GOMBOK */}
                        <div className="
                        mt-8
                        pt-6
                        border-t border-slate-100
                        flex
                        items-center
                        justify-between
                        gap-3
                    ">

                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentTaskIndex === 0}
                                className="
                                flex
                                items-center
                                gap-2
                                px-4 sm:px-6
                                py-3
                                rounded-xl
                                font-semibold
                                text-primary
                                bg-primary/10
                                hover:bg-primary/20
                                disabled:opacity-40
                                disabled:cursor-not-allowed
                            "
                            >
                                <span className="material-icons text-sm">
                                    arrow_back
                                </span>

                                <span className="hidden sm:inline">
                                    Előző
                                </span>
                            </button>


                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={currentTaskIndex === totalTasks - 1}
                                className="
                                flex
                                items-center
                                gap-2
                                px-5 sm:px-8
                                py-3
                                rounded-xl
                                font-semibold
                                text-white
                                bg-primary
                                hover:bg-primary/90
                                disabled:opacity-40
                                disabled:cursor-not-allowed
                                shadow-lg
                                shadow-primary/25
                            "
                            >
                                <span>
                                    {currentTaskIndex === totalTasks - 1
                                        ? "Befejezés"
                                        : "Következő"
                                    }
                                </span>

                                <span className="material-icons text-sm">
                                    {currentTaskIndex === totalTasks - 1
                                        ? "check"
                                        : "arrow_forward"
                                    }
                                </span>
                            </button>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default PracticePage