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

    return (
        <div>
            {tasks.map((task) => (
                <div key={task.id}>
                    {/* itt jelenítheted meg a task.tipus és task.valaszok alapján a feladatot */}
                </div>
            ))}
        </div>
    );
}

export default PracticePage