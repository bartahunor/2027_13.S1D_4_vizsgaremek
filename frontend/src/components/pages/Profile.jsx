import { useEffect, useState } from "react";
import { apiFetch } from '../../lib/apiClient';

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
        <main className="pt-20">
            <section className="w-full bg-white rounded-2xl border border-[#ECE7F2] shadow-sm p-space-lg mb-space-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-lg">

                    <div className="flex items-center gap-space-lg">

                        <div className="relative">

                            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center font-headline-lg text-headline-lg font-bold tracking-tight shadow-md">
                                KD
                            </div>

                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow ring-2 ring-white">
                                <span className="material-symbols-outlined text-[13px] font-bold">
                                    check
                                </span>
                            </div>

                        </div>

                        <div className="flex flex-col">

                            <div className="flex items-center gap-space-sm flex-wrap">

                                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                                    Kovács Dániel
                                </h1>

                                <span className="px-space-sm py-0.5 rounded-full bg-[#EFEAF6] text-[#351F5B] font-label-xs text-label-xs uppercase tracking-wider font-semibold">
                                    Tanuló
                                </span>

                                <span className="px-space-sm py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-xs text-label-xs font-medium">
                                    Végzős
                                </span>

                            </div>

                            <p className="font-body-md text-body-md text-on-surface-variant mt-1 flex items-center gap-1.5">

                                <span className="material-symbols-outlined text-[16px] text-secondary">
                                    verified
                                </span>

                                TudásTér tag:

                                <span className="font-medium text-on-surface">
                                    2025. szeptember
                                </span>

                                óta · Cél:

                                <span className="text-primary font-semibold">
                                    Érettségi 2026
                                </span>

                            </p>

                        </div>

                    </div>

                    <div className="flex items-center gap-space-sm self-start md:self-center">

                        <button
                            className="group flex items-center gap-space-sm px-space-md py-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-body-md text-body-md font-medium transition-all shadow-sm border border-[#E3DCED]"
                            id="editProfileBtn"
                            type="button"
                        >
                            <span className="material-symbols-outlined text-[18px] text-secondary group-hover:rotate-12 transition-transform">
                                edit_note
                            </span>

                            <span>
                                Profil szerkesztése
                            </span>
                        </button>

                        <button
                            aria-label="Megosztás"
                            className="w-10 h-10 rounded-xl bg-surface-container border border-[#E3DCED] flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                            type="button"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                share
                            </span>
                        </button>

                    </div>

                </div>
            </section>
        </main>
    )
}

export default ProfilePage;

