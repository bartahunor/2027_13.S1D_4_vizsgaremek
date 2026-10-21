import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../../lib/apiClient";
import { getForrasKepUrl } from "../../lib/supabaseStorage";
import { taskTypes, fallbackType } from "../ui/tasktypes/tasktypes.js";

// Alapértelmezett serializer: a szöveget trimeli, az üreset null-ra alakítja,
// a számot és a tömböt változatlanul hagyja, az undefined-ot null-ra alakítja.
const defaultSerialize = (value) => {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
    }
    return value ?? null;
};

function PracticePage() {
    const [searchParams] = useSearchParams();

    const subject = searchParams.get("subject");
    const level = searchParams.get("level");
    const year = searchParams.get("year"); // null, ha nincs beállítva
    const topic = searchParams.get("topic"); // null, ha nincs beállítva

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //Fruzsi
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

    // Feladatonkénti válaszok: { [taskId]: value }
    const [answers, setAnswers] = useState({});

    const [submitting, setSubmitting] = useState(false);

    const [startedAt, setStartedAt] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const [testId, setTestId] = useState(null);

    useEffect(() => {
        if (startedAt === null) return;

        const updateTimer = () => {
            setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
        };

        updateTimer();

        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [startedAt]);

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const pad = (number) => String(number).padStart(2, "0");

        return hours > 0
            ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
            : `${pad(minutes)}:${pad(secs)}`;
    };

    useEffect(() => {
        let cancelled = false;

        const loadTasks = async () => {
            setLoading(true);
            setError(null);
            setTestId(null);

            try {
                const params = new URLSearchParams({
                    tantargy_id: subject,
                    szint: level,
                });

                if (year) params.set("ev", year);
                else if (topic) params.set("temakor_id", topic);

                const data = await apiFetch(
                    `/taskroutes/chosentasks?${params.toString()}`,
                );

                const tasksWithImages = await Promise.all(
                    data.map(async (task) => ({
                        ...task,
                        forras_kep_url: await getForrasKepUrl(task.forras_kep),
                    })),
                );

                if (cancelled) return;

                // Teszt indítása a megérkezett feladatokból (a nev-et nem küldjük)
                let newTestId = null;
                if (tasksWithImages.length > 0) {
                    const started = await apiFetch("/taskroutes/starttest", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            tantargy_id: Number(subject),
                            feladat_idk: tasksWithImages.map((task) => task.id),
                        }),
                    });

                    if (cancelled) return;
                    newTestId = started.teszt_id;
                }

                setTasks(tasksWithImages);
                setTestId(newTestId);
                setCurrentTaskIndex(0);
                setAnswers({});
                setElapsedSeconds(0);
                setStartedAt(tasksWithImages.length > 0 ? Date.now() : null);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        if (subject && level && (year || topic)) {
            loadTasks();
        }

        return () => {
            cancelled = true;
        };
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

                    <h2 className="text-lg font-semibold mt-3">Nincsenek feladatok</h2>

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
    const { Source, Answer } = taskTypes[currentTask.tipus] ?? fallbackType;

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

    const handleFinish = async () => {
      if (submitting) return;
      setSubmitting(true);

      try {
        const submission = buildSubmission();
        console.log("Beküldendő:", submission);

        const result = await apiFetch("/correctionroutes/incoming", {
          method: "POST",
          body: JSON.stringify({
            valaszok: submission,
            ido: Math.max(0, Math.round(elapsedSeconds)),
          }),
        });

        console.log("Backend válasza:", result);
      } catch (err) {
        console.error("Beküldési hiba:", err);
      } finally {
        setSubmitting(false);
      }
    };

    const handleNext = () => {
        if (currentTaskIndex < totalTasks - 1) {
            setCurrentTaskIndex((prev) => prev + 1);
        } else {
            handleFinish();
        }
    };

    const handleFullscreen = () => {
        const element = document.getElementById("source-material");

        if (element?.requestFullscreen) {
            element.requestFullscreen();
        }
    };

    const buildSubmission = () =>
        tasks.map((task, index) => {
            const id = task.id ?? index;
            const type = taskTypes[task.tipus] ?? fallbackType;
            const serialize = type.serialize ?? defaultSerialize;

            return {
                feladat_id: id,
                tipus: task.tipus,
                valasz: serialize(answers[id], task),
            };
        });

    return (
        <div className="min-h-screen flex flex-col bg-background-light text-slate-900 font-display relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-100"></div>
           

            {/* FŐ TARTALOM */}
            <main
                className="
                     relative z-10 flex-grow
    flex flex-col items-stretch
    pt-24 pb-6 px-3
    sm:pt-16 sm:pb-8 sm:px-6
    md:items-center md:pt-28 md:pb-10 md:px-10

                "
            >
                <div
                className="
                    relative z-20
                    flex items-center gap-2
                    w-fit ml-auto mb-3
                    rounded-2xl
                    border border-[#4B2A7F]/20
                    bg-white
                    px-3 py-2
                    text-[#351F5B]
                    shadow-lg shadow-[#351F5B]/10
                    text-sm font-semibold
                    tabular-nums
                    sm:hidden
                "
                role="timer"
                aria-label={`Eltelt idő: ${formatTime(elapsedSeconds)}`}
            >
                <span className="material-symbols-outlined text-xl text-[#4B2A7F]">
                    timer
                </span>
                <span>{formatTime(elapsedSeconds)}</span>
            </div>

              
                <div
                    className="
                    max-w-7xl
                    w-full
                    min-w-0
                    bg-white
                    rounded-xl
                    shadow-2xl
                    shadow-primary/5
                    border border-primary/10
                    overflow-hidden
                    flex flex-col
                    md:flex-row
                    md:max-h-[850px]
                "
                >
                      <div
                className="
    hidden sm:flex
    fixed top-24 right-8
    z-[100]
    items-center gap-2
    rounded-2xl
    border border-[#4B2A7F]/20
    bg-white/95
    px-4 py-3
    text-[#351F5B]
    shadow-lg shadow-[#351F5B]/10
    backdrop-blur-md
    text-sm font-semibold
    tabular-nums
"
                role="timer"
                aria-label={`Eltelt idő: ${formatTime(elapsedSeconds)}`}
            >
                <span className="material-symbols-outlined text-xl text-[#4B2A7F]">
                    timer
                </span>
                <span>{formatTime(elapsedSeconds)}</span>
            </div>
                    {/* BAL OLDAL */}
                    <div
                        className="
                        w-full
                        md:w-1/2
                        bg-slate-50
                        p-3 sm:p-6 lg:p-8
                        flex flex-col
                        min-w-0
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
                        p-3 sm:p-6 lg:p-10
                        flex flex-col
                        min-w-0
                    "
                    >
                        <div className="mb-6 sm:mb-8">
                            <div
                                className="
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
                        "
                            >
                                {currentNumber} / {totalTasks}
                            </div>

                            <h2
                                className="
                                text-lg sm:text-xl md:text-2xl
                                font-semibold leading-relaxed
                                break-words
                            "
                            >
                                {currentTask.feladat_szoveg ||
                                    currentTask.kerdes ||
                                    currentTask.kerdes_szoveg}
                            </h2>
                        </div>

                        {/* FELADAT */}
                        <div
                            className="
                            flex-grow min-w-0
                            space-y-4
                            overflow-visible
                            p-1 sm:p-3
                            md:overflow-y-auto md:pr-2
                        "
                        >
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
                        <div
                            className="
                            mt-5 sm:mt-8
                            pt-4 sm:pt-6
                            border-t border-slate-100
                            flex
                            items-center
                            justify-between
                            gap-3
                            shrink-0
                        "
                        >
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

                                <span className="hidden sm:inline">Előző</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleNext}
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
                                        : "Következő"}
                                </span>

                                <span className="material-symbols-outlined text-sm">
                                    {currentTaskIndex === totalTasks - 1
                                        ? "check"
                                        : "arrow_forward"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default PracticePage;
