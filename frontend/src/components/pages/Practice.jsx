import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../lib/apiClient';
import { getForrasKepUrl } from '../../lib/supabaseStorage';
import { taskTypes, fallbackType } from '../ui/tasktypes/tasktypes.js';

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

    // Feladatonkénti válaszok: { [taskId]: value }
    const [answers, setAnswers] = useState({});


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
                setAnswers({});
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

    // A feladat típusa alapján választjuk ki a bal (Source) és jobb (Answer) oldalt.
    // Ismeretlen vagy hiányzó típusnál a fallbackType lép be.
    const { Source, Answer } = taskTypes[currentTask.feladat_tipus] ?? fallbackType;

    // A feladat azonosítója: cseréld a valódi mezőnévre, ha nem "id".
    const taskId = currentTask.id ?? currentTaskIndex;

    const value = answers[taskId];

    const onChange = (newValue) => {
        setAnswers((prev) => ({ ...prev, [taskId]: newValue }));
    };

    const handlePrevious = () => {
        if (currentTaskIndex > 0) {
            setCurrentTaskIndex((prev) => prev - 1);
        }
    };

    const handleNext = () => {
        if (currentTaskIndex < totalTasks - 1) {
            setCurrentTaskIndex((prev) => prev + 1);
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


            {/* FŐ TARTALOM */}
            <main className="relative z-10 flex-grow flex items-center justify-center pt-20 pb-6 px-4 sm:pt-24 sm:pb-8 sm:px-6 md:pt-28 md:pb-10 md:px-10">

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
                    max-h-[850px] 
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
                                <span className="material-symbols-outlined text-sm">
                                    fullscreen
                                </span>
                            </button>

                        </div>


                        {/* FORRÁSANYAG (típusfüggő) */}
                        <Source
                            key={taskId}
                            task={currentTask}
                            value={value}
                            onChange={onChange}
                        />

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

                            {/* VÁLASZ (típusfüggő, lehet hiányzó is) */}
                            {Answer && (
                                <Answer
                                    key={taskId}
                                    task={currentTask}
                                    value={value}
                                    onChange={onChange}
                                />
                            )}

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
                                <span className="material-symbols-outlined text-sm">
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

                                <span className="material-symbols-outlined text-sm">
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