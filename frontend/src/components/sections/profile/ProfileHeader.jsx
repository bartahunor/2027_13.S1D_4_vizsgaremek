
import { useEffect, useState } from "react";

const szerepNevek = {
    tanar: "Tanár",
    diak: "Diák",
    admin: "Admin",
};

function ProfileHeader({ profildata }) {
    const [modalNyitva, setModalNyitva] = useState(false);
    const [animacioLathato, setAnimacioLathato] = useState(false);
    const [zarasFolyamatban, setZarasFolyamatban] = useState(false);
    const [profilkep, setProfilkep] = useState(profildata.profilkep ?? null);
    const [ujProfilkep, setUjProfilkep] = useState(null);

    const [felhasznalonev, setFelhasznalonev] = useState(
        profildata.felhasznalonev ?? ""

        
    );
    useEffect(() => {
    if (profildata?.felhasznalonev) {
        setFelhasznalonev(profildata.felhasznalonev);
        setMonogram(
            profildata.felhasznalonev.trim().charAt(0).toUpperCase() || "?"
        );
    }
}, [profildata?.felhasznalonev]);

    const [email, setEmail] = useState(profildata.email ?? "");
    const [monogram, setMonogram] = useState(
        profildata.felhasznalonev?.charAt(0).toUpperCase() ?? "?"
    );

    const eredetiNev = profildata.felhasznalonev ?? "";
    const eredetiEmail = profildata.email ?? "";
    const szerepFelirat =
        szerepNevek[profildata.szerep] ?? profildata.szerep;

    const csatlakozasDatuma = profildata.created_at
        ? new Date(profildata.created_at).toLocaleDateString("hu-HU", {
            year: "numeric",
            month: "2-digit",
            day: "numeric",
        })
        : "";

    useEffect(() => {
        if (!modalNyitva) return;

        function escapeBezáras(event) {
            if (event.key === "Escape") setModalNyitva(false);
        }

        document.addEventListener("keydown", escapeBezáras);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", escapeBezáras);
            document.body.style.overflow = "";
        };
    }, [modalNyitva]);

    function visszaallitas() {
        setFelhasznalonev(profildata.felhasznalonev ?? "");
        setEmail(profildata.email ?? "");
        setMonogram(
            profildata.felhasznalonev?.charAt(0).toUpperCase() ?? "?"
        );
        setUjProfilkep(null);
    }



    function helyiAlkalmazas() {
    // A név és a profilkép megtartása a komponens állapotában
    if (ujProfilkep) {
        setProfilkep(ujProfilkep);
    }

    setModalNyitva(false);
}

    const ablakMegnyitasa = () => {
        setModalNyitva(true);
        setZarasFolyamatban(false);
        setAnimacioLathato(false);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setAnimacioLathato(true);
            });
        });
    };

    function bezaras() {
        if (zarasFolyamatban) return;

        visszaallitas();
        setZarasFolyamatban(true);
        setAnimacioLathato(false);

        setTimeout(() => {
            setModalNyitva(false);
            setZarasFolyamatban(false);
        }, 300);
    }

    return (
        <>
            <section className="mb-6 w-full rounded-2xl border border-[#E8E3EE] bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                        <div className="relative shrink-0">
                            <div className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-[#351F5B] text-2xl font-bold tracking-tight text-white shadow-md sm:h-20 sm:w-20">
                                {monogram}
                            </div>

                            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white">
                                <span className="material-symbols-outlined text-[13px]">
                                    check
                                </span>
                            </div>
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="break-words text-xl font-semibold tracking-tight text-[#351F5B] sm:text-[28px]">
                                    {felhasznalonev}
                                </h1>

                                <span className="rounded-full bg-[#EFEAF6] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#351F5B]">
                                    {szerepFelirat}
                                </span>
                            </div>

                            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-[#49454F]">
                                <span className="material-symbols-outlined text-base text-[#4B2A7F]">
                                    verified
                                </span>
                                <span>TudásTér tag:</span>
                                <span className="font-medium text-[#27222E]">
                                    {csatlakozasDatuma}
                                </span>
                                <span>óta</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={ablakMegnyitasa}
                        className="group inline-flex items-center gap-2 rounded-xl bg-[#351F5B] px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#4B2A7F] hover:shadow-lg active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:rotate-12">
                            edit_note
                        </span>
                        Profil szerkesztése
                    </button>
                </div>
            </section>

            {modalNyitva && (
                <div
                    className={`fixed inset-0 z-[100] flex items-end justify-center
                    bg-[#17121F]/50 p-0 backdrop-blur-sm sm:items-center sm:p-4
                    transition-opacity duration-300 ease-out
                    ${animacioLathato ? 'opacity-100' : 'opacity-0'}`}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) bezaras();
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="profile-modal-title"
                        className={`relative max-h-[92dvh] w-full max-w-lg overflow-y-auto
                        rounded-t-3xl border border-[#E8E3EE] bg-white p-5 shadow-2xl
                        sm:rounded-3xl sm:p-7 transform-gpu
                        transition-all duration-300 ease-out
                        ${animacioLathato
                                ? 'translate-y-0 scale-100 opacity-100'
                                : 'translate-y-full sm:translate-y-3 sm:scale-95 opacity-0'
                            }`}
                    >
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#806A9D]">
                                    Fiókbeállítások
                                </p>
                                <h2
                                    id="profile-modal-title"
                                    className="text-2xl font-bold tracking-tight text-[#351F5B]"
                                >
                                    Profil szerkesztése
                                </h2>
                                <p className="mt-1 text-sm text-[#77717F]">
                                    Személyes adataid előnézete.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={bezaras}
                                aria-label="Ablak bezárása"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#62576F] transition hover:bg-[#F3EFF8]"
                            >
                                <span className="material-symbols-outlined">
                                    close
                                </span>
                            </button>
                        </div>

                        {/* Élő előnézet */}
                        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[#E8E0F2] bg-[#F8F5FC] p-4">
                            <label
                                htmlFor="profile-image"
                                className="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-[#351F5B] text-xl font-bold text-white shadow-sm"
                                title="Profilkép cseréje"
                            >
                                {ujProfilkep || profilkep ? (
                                    <img
                                        src={ujProfilkep || profilkep}
                                        alt="Profilkép előnézete"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{monogram || "?"}</span>
                                )}

                                <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                    <span className="material-symbols-outlined text-2xl text-white">
                                        photo_camera
                                    </span>
                                </span>
                            </label>

                            <input
                                id="profile-image"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];

                                    if (!file) return;

                                    if (!file.type.startsWith("image/")) {
                                        event.target.value = "";
                                        return;
                                    }

                                    const reader = new FileReader();

                                    reader.onload = () => {
                                        setUjProfilkep(reader.result);
                                    };

                                    reader.readAsDataURL(file);
                                }}
                            />

                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[#351F5B]">
                                    {felhasznalonev || "Felhasználónév"}
                                </p>

                                <p className="break-all text-sm text-[#77717F]">
                                    {email || "E-mail-cím"}
                                </p>

                                <label
                                    htmlFor="profile-image"
                                    className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#6D48A0] transition hover:text-[#351F5B]"
                                >
                                    <span className="material-symbols-outlined text-base">
                                        photo_camera
                                    </span>
                                    Profilkép cseréje
                                </label>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label
                                    htmlFor="profile-username"
                                    className="mb-2 block text-sm font-semibold text-[#351F5B]"
                                >
                                    Felhasználónév
                                </label>
                                <input
                                    id="profile-username"
                                    value={felhasznalonev}
                                    onChange={(event) => {
                                        const nev = event.target.value;
                                        setFelhasznalonev(nev);
                                        setMonogram(
                                            nev.trim().charAt(0).toUpperCase() || "?"
                                        );
                                    }}
                                    maxLength={40}
                                    className="w-full rounded-xl border border-[#E3DCED] bg-white px-4 py-3 text-sm text-[#27222E] outline-none transition placeholder:text-[#A49BAF] focus:border-[#8060A8] focus:ring-4 focus:ring-[#8060A8]/10"
                                    placeholder="Add meg a felhasználóneved"
                                />
                            </div>


                        </div>

                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                            <button
                                type="button"
                                onClick={visszaallitas}
                                className="rounded-xl border border-[#E3DCED] px-4 py-3 text-sm font-semibold text-[#62576F] transition hover:bg-[#F7F6F8] sm:py-2.5"
                            >
                                Visszaállítás
                            </button>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={bezaras}
                                    className="rounded-xl px-4 py-3 text-sm font-semibold text-[#62576F] transition hover:bg-[#F7F6F8] sm:py-2.5"
                                >
                                    Mégse
                                </button>
                                <button
                                    type="button"
                                    onClick={helyiAlkalmazas}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#351F5B] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#4B2A7F] active:scale-[0.98] sm:py-2.5"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        check
                                    </span>
                                    Alkalmazás
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ProfileHeader;
