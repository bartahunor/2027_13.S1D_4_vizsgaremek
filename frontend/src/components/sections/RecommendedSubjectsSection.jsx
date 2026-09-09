import { useState, useEffect } from 'react';
import SubjectCard from '../ui/SubjectCard';

const SUBJECT_STYLES = {
    "Angol nyelv": {
        icon: "translate",
        color: "w-16 h-16 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors",
    },
    "Történelem": {
        icon: "history_edu",
        color: "w-16 h-16 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors",
    },
    "Irodalom": {
        icon: "menu_book",
        color: "w-16 h-16 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors",
    },
    "Biológia": {
        icon: "science",
        color: "w-16 h-16 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors",
    },
};

const DEFAULT_STYLE = {
    icon: "school",
    color: "w-16 h-16 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-6 group-hover:bg-slate-600 group-hover:text-white transition-colors",
};

function RecommendedSubjectsSection() {
    const [subs, setSubs] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loading2, setLoading2] = useState(true);
    const [error, setError] = useState(null);
    const [error2, setError2] = useState(null);

    useEffect(() => {
        async function fetchSubjects() {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/temakorok/szuro_tantargyossz');

            if (!response.ok) {
            throw new Error(`Hiba történt: ${response.status}`);
            }

            const data = await response.json();
            setSubs(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        }

        async function fetchTasks() {
        try {
            setLoading2(true);
            const response = await fetch('http://localhost:3000/api/feladatok/szuro_tanfel');

            if (!response.ok) {
            throw new Error(`Hiba történt: ${response.status}`);
            }

            const data = await response.json();
            setTasks(data);
        } catch (err) {
            setError2(err.message);
        } finally {
            setLoading2(false);
        }
        }

        fetchSubjects();
        fetchTasks();
    }, []); 

    if (loading) return <p>Betöltés...</p>;
    if (loading2) return <p>Betöltés...</p>;
    if (error) return <p>Hiba: {error}</p>;
    if (error2) return <p>Hiba: {error2}</p>;


    const allSubjectNames = new Set([
        ...subs.map((s) => s.tantargy),
        ...tasks.map((t) => t.tantargy),
    ]);

    const subjects = Array.from(allSubjectNames).map((name) => {
        const topicEntry = subs.find((s) => s.tantargy === name);
        const taskEntry = tasks.find((t) => t.tantargy === name);
        const style = SUBJECT_STYLES[name] || DEFAULT_STYLE;

        return {
            name,
            icon: style.icon,
            color: style.color,
            topic: topicEntry ? Number(topicEntry.darab) : 0,
            task: taskEntry ? Number(taskEntry.darab) : 0,
        };
    });

    return (
        <section className="py-62 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="max-w-xl">
                        <h2 className="text-4xl font-black mb-4" id="tantargyak">Tantárgyaink:</h2>
                        <p className="text-slate-500">Minden tananyagunk az Oktatási Hivatal által közzétett érettségi feladatok követelményeit tartalmazza.</p>
                    </div>
                    <a className="text-primary font-bold flex items-center gap-2 group" href="#">

                    </a>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {subjects.map((subject, index) => (
                        <SubjectCard
                            key={index}
                            icon={subject.icon}
                            color={subject.color}
                            name={subject.name}
                            topic={subject.topic}
                            task={subject.task}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
};

export default RecommendedSubjectsSection;