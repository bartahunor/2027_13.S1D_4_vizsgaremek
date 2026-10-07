const szerepNevek = {
    tanar: 'Tanár',
    diak: 'Diák',
    admin: 'Admin',
};

function ProfileHeader({ profildata }) {
    const szerepFelirat = szerepNevek[profildata.szerep] ?? profildata.szerep;

    const kezdobetu = profildata.felhasznalonev?.charAt(0).toUpperCase() ?? '?';

    const csatlakozasDatuma = profildata.created_at
        ? new Date(profildata.created_at).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: '2-digit',
            day: 'numeric',
        })
        : '';

    return (
        <section className="w-full bg-white rounded-2xl border border-[#E8E3EE] shadow-sm p-6 mb-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                {/* BAL OLDAL */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">

                    {/* AVATAR */}
                    <div className="relative">

                        <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-[#351F5B] text-white flex items-center justify-center text-2xl font-bold tracking-tight shadow-md">
                            {kezdobetu}
                        </div>

                        {/* AKTÍV JELZÉS */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow ring-2 ring-white">
                            <span className="material-symbols-outlined text-[13px] font-bold">
                                check
                            </span>
                        </div>

                    </div>

                    {/* NÉV + INFORMÁCIÓK */}
                    <div className="flex flex-col">

                        <div className="flex items-center gap-2 flex-wrap">

                            <h1 className="text-[28px] leading-9 font-semibold text-[#351F5B] tracking-tight">
                                {profildata.felhasznalonev}
                            </h1>

                            {/* TANULÓ */}
                            <span className="px-2 py-0.5 rounded-full bg-[#EFEAF6] text-[#351F5B] text-[11px] leading-[14px] uppercase tracking-wider font-semibold">
                                {szerepFelirat}
                            </span>

                        </div>

                        {/* MÁSODLAGOS INFORMÁCIÓ */}
                        <p className="text-sm leading-[22px] text-[#49454F] mt-1 flex items-center gap-1.5 flex-wrap">

                            <span className="material-symbols-outlined text-[16px] text-[#4B2A7F]">
                                verified
                            </span>

                            <span>
                                TudásTér tag:
                            </span>

                            <span className="font-medium text-[#27222E]">
                                {csatlakozasDatuma}
                            </span>

                            <span>
                                óta
                            </span>

                        </p>

                    </div>

                </div>

                {/* JOBB OLDALI GOMBOK */}
                <div className="flex w-full sm:w-auto items-center gap-2 self-stretch sm:self-start md:self-center">

                    {/* PROFIL SZERKESZTÉSE */}
                    <button
                        className="group flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#F7F6F8] hover:bg-[#EEEAF4] text-[#351F5B] text-sm leading-[22px] font-medium transition-all shadow-sm border border-[#E3DCED]"
                        id="editProfileBtn"
                        type="button"
                    >

                        <span className="material-symbols-outlined text-[18px] text-[#4B2A7F] group-hover:rotate-12 transition-transform">
                            edit_note
                        </span>

                        <span>
                            Profil szerkesztése
                        </span>

                    </button>

                </div>

            </div>

        </section>
    );
}

export default ProfileHeader;