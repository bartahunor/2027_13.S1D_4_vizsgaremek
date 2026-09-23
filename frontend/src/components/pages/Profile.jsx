import { useEffect, useState } from "react";
import { apiFetch } from  '../../lib/apiClient';

function ProfilePage() {

    const [profildata, setProfildata] = useState([]);
    const [profiltests, setProfiltests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        const loadProfilData = async () => {
            try {
                setLoading(true);
                const data = await apiFetch('/profilroutes/me');
                setProfildata(data);
                console.log('Beérkezett adat:', data);
            } catch (err) {
                setError("Nem sikerült betölteni az adatokat.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadProfilData();

        const loadProfilTests = async () => {
            try {
                setLoading(true);
                const data = await apiFetch('/profilroutes/me/tests');
                setProfiltests(data);
                console.log('Beérkezett adat:', data);
            } catch (err) {
                setError("Nem sikerült betölteni az adatokat.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadProfilTests();
    }, []);

    return (
        <p className="text-lg font-medium text-slate-700">Profil oldal</p>
    )
}

export default ProfilePage;

