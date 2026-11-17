
import { useEffect, useMemo, useState } from "react";

const passwordRequirements = [
    {
        key: "length",
        label: "Min. 8 karakter",
        test: (password) => password.length >= 8,
    },
    {
        key: "cases",
        label: "Kis- és nagybetű",
        test: (password) => /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
        key: "number",
        label: "Legalább egy szám",
        test: (password) => /[0-9]/.test(password),
    },
    {
        key: "special",
        label: "Speciális karakter (!@#$%)",
        test: (password) => /[^A-Za-z0-9]/.test(password),
    },
];

export default function ResetPasswordPage({
    onResetPassword,
    userName = "",
    userEmail = "",
    redirectTo = "/profil",
}) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [logoutOthers, setLogoutOthers] = useState(true);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [countdown, setCountdown] = useState(3);

    const token = new URLSearchParams(window.location.search).get("token");

    const requirements = useMemo(
        () =>
            passwordRequirements.map((requirement) => ({
                ...requirement,
                valid: requirement.test(password),
            })),
        [password]
    );

    const strength = requirements.filter((item) => item.valid).length;

    const passwordsMatch =
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword;

    const strengthInfo = useMemo(() => {
        if (!password) {
            return {
                label: "Nincs megadva",
                color: "bg-surface-container-high",
                textColor: "text-on-surface-variant",
            };
        }

        if (strength <= 1) {
            return {
                label: "Gyenge",
                color: "bg-red-500",
                textColor: "text-red-500",
            };
        }

        if (strength === 2) {
            return {
                label: "Közepes",
                color: "bg-amber-500",
                textColor: "text-amber-600",
            };
        }

        if (strength === 3) {
            return {
                label: "Jó",
                color: "bg-primary",
                textColor: "text-primary",
            };
        }

        return {
            label: "Kiváló / Erős",
            color: "bg-primary-container",
            textColor: "text-primary-container",
        };
    }, [password, strength]);

    const isPasswordValid = strength === 4;

    useEffect(() => {
        if (!success) return;

        if (countdown <= 0) {
            window.location.assign(redirectTo);
            return;
        }

        const timer = setTimeout(() => {
            setCountdown((previous) => previous - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [success, countdown, redirectTo]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!token) {
            setError(
                "A jelszó-visszaállító hivatkozás érvénytelen vagy hiányos. Kérj új jelszó-visszaállító e-mailt."
            );
            return;
        }

        if (!isPasswordValid) {
            setError("A jelszó nem teljesíti az összes biztonsági követelményt.");
            return;
        }

        if (!passwordsMatch) {
            setError("A két jelszó nem egyezik.");
            return;
        }

        if (typeof onResetPassword !== "function") {
            setError("A jelszó-visszaállítási szolgáltatás még nincs beállítva.");
            return;
        }

        try {
            setLoading(true);

            await onResetPassword({
                token,
                password,
                logoutOthers,
            });

            setSuccess(true);
            setCountdown(3);
        } catch (err) {
            setError(
                err?.message ||
                "Nem sikerült megváltoztatni a jelszót. Próbáld újra később."
            );
        } finally {
            setLoading(false);
        }
    };

    const displayName = userName || "Tudástér-felhasználó";

    return (
        <div className="min-h-screen flex flex-col bg-[#F4F2F8] text-[#24123D] font-display">

            {/* Tartalom */}
            <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-start px-4 pt-32 pb-12 sm:pt-36 sm:pb-16">


                <div className="relative z-10 w-full max-w-[540px]">
                    {/* Sikeres visszajelzés */}
                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-[#EBE5F4] border border-[#D9CDEB] flex items-start gap-3 animate-[fadeIn_0.3s_ease-out]">
                            <div className="w-8 h-8 rounded-full bg-[#351F5B] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-white text-lg">
                                    verified
                                </span>
                            </div>

                            <div className="flex-1">
                                <h3 className="font-semibold text-[#351F5B]">
                                    A jelszavad sikeresen frissítve!
                                </h3>

                                <p className="text-sm text-[#6B6178] mt-1">
                                    Átirányítás a felkészülési felületedre{" "}
                                    <span className="font-bold text-[#351F5B] tabular-nums">
                                        {countdown} mp
                                    </span>{" "}
                                    múlva...
                                </p>
                            </div>
                        </div>
                    )}

                    <section className="bg-white rounded-2xl shadow-xl shadow-[#351F5B]/[0.06] border border-[#EAE5F0] overflow-hidden">

                        {/* Lila átmenetes felső csík */}
                        <div className="h-1.5 bg-gradient-to-r from-[#24123D] via-[#4B2A7F] to-[#B49BD8]" />

                        <div className="p-5 sm:p-9">

                            {/* Ikon és cím */}
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="relative mb-5">
                                    <div className="relative mb-5">
                                        <div className="w-16 h-16 rounded-2xl bg-[#351F5B] flex items-center justify-center shadow-lg shadow-[#351F5B]/20">
                                            <span className="material-symbols-outlined text-white text-3xl">
                                                lock_reset
                                            </span>
                                        </div>

                                    </div>
                                </div>

                                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6D4DA3] mb-2">
                                    TudásTér fiókkezelés
                                </span>

                                <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#351F5B]">
                                    Új jelszó megadása
                                </h1>

                                <p className="text-sm sm:text-base text-[#756C82] mt-3 max-w-md leading-relaxed">
                                    Hozz létre egy erős, biztonságos jelszót{" "}
                                    {userEmail ? (
                                        <>
                                            a(z){" "}
                                            <span className="font-semibold text-[#351F5B]">
                                                {displayName}
                                            </span>{" "}
                                            (<span className="text-[#24123D]">{userEmail}</span>)
                                            fiókodhoz.
                                        </>
                                    ) : (
                                        "a Tudástér-fiókodhoz."
                                    )}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Új jelszó */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label
                                            htmlFor="newPassword"
                                            className="text-sm font-semibold text-[#24123D]"
                                        >
                                            Új jelszó
                                        </label>

                                        <span
                                            className={`text-[11px] font-bold uppercase tracking-wide ${strengthInfo.textColor}`}
                                        >
                                            {strengthInfo.label}
                                        </span>
                                    </div>

                                    <div className="relative">
                                        <input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(event) => {
                                                setPassword(event.target.value);
                                                setError("");
                                            }}
                                            placeholder="Legalább 8 karakter..."
                                            disabled={success}
                                            className="w-full bg-[#F7F5FA] focus:bg-white border border-transparent focus:border-[#9B83BD] text-[#24123D] placeholder:text-[#A49BAF] text-sm px-4 py-3.5 pr-12 rounded-xl outline-none transition-all duration-200 focus:ring-4 focus:ring-[#351F5B]/[0.06] disabled:opacity-60"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((previous) => !previous)}
                                            aria-label={
                                                showPassword ? "Jelszó elrejtése" : "Jelszó felfedése"
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#81778F] hover:text-[#351F5B] transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Jelszóerősség */}
                                    <div className="mt-3">
                                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                                            {[0, 1, 2, 3].map((index) => (
                                                <div
                                                    key={index}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${index < strength
                                                        ? strengthInfo.color
                                                        : "bg-[#EAE6EF]"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Követelmények */}
                                    <div className="mt-3 bg-[#F7F5FA] rounded-xl p-3.5 space-y-3">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#81778F]">
                                            Követelmények
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {requirements.map((requirement) => (
                                                <div
                                                    key={requirement.key}
                                                    className={`flex items-center gap-2 text-xs transition-colors ${requirement.valid
                                                        ? "text-[#351F5B] font-semibold"
                                                        : "text-[#968D9F]"
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-[17px]">
                                                        {requirement.valid
                                                            ? "check_circle"
                                                            : "radio_button_unchecked"}
                                                    </span>

                                                    <span>{requirement.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Jelszó megerősítése */}
                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-semibold text-[#24123D] mb-2"
                                    >
                                        Új jelszó megerősítése
                                    </label>

                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={(event) => {
                                                setConfirmPassword(event.target.value);
                                                setError("");
                                            }}
                                            placeholder="Jelszó ismétlése"
                                            disabled={success}
                                            className="w-full bg-[#F7F5FA] focus:bg-white border border-transparent focus:border-[#9B83BD] text-[#24123D] placeholder:text-[#A49BAF] text-sm px-4 py-3.5 pr-12 rounded-xl outline-none transition-all duration-200 focus:ring-4 focus:ring-[#351F5B]/[0.06] disabled:opacity-60"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword((previous) => !previous)
                                            }
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Jelszó elrejtése"
                                                    : "Jelszó felfedése"
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#81778F] hover:text-[#351F5B] transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {showConfirmPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>

                                    {passwordsMatch && (
                                        <div className="flex items-center gap-1.5 text-xs text-[#351F5B] font-semibold mt-2">
                                            <span className="material-symbols-outlined text-lg">
                                                check_circle
                                            </span>
                                            A két jelszó pontosan egyezik
                                        </div>
                                    )}

                                    {confirmPassword.length > 0 && !passwordsMatch && (
                                        <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium mt-2">
                                            <span className="material-symbols-outlined text-lg">
                                                error
                                            </span>
                                            A két jelszó nem egyezik
                                        </div>
                                    )}
                                </div>

                                {/* Hibaüzenet */}
                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm"
                                    >
                                        <span className="material-symbols-outlined text-lg shrink-0">
                                            error
                                        </span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Küldés */}
                                <button
                                    type="submit"
                                    disabled={
                                        loading ||
                                        success ||
                                        !isPasswordValid ||
                                        !passwordsMatch
                                    }
                                    className="w-full bg-[#351F5B] hover:bg-[#24123D] disabled:bg-[#A99CB9] disabled:cursor-not-allowed text-white font-semibold text-sm py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#351F5B]/20 hover:shadow-xl hover:shadow-[#351F5B]/25 transition-all duration-200 active:scale-[0.99]"
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-xl">
                                                progress_activity
                                            </span>
                                            Jelszó módosítása...
                                        </>
                                    ) : success ? (
                                        <>
                                            <span className="material-symbols-outlined text-xl">
                                                check_circle
                                            </span>
                                            Sikeres jelszómódosítás
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-xl">
                                                check
                                            </span>
                                            Jelszó megváltoztatása és belépés
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Vissza a bejelentkezéshez */}
                            <div className="mt-7 flex flex-col items-center gap-4">
                                <a
                                    href="/bejelentkezes"
                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#81778F] hover:text-[#351F5B] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base">
                                        arrow_back
                                    </span>
                                    Vissza a bejelentkezéshez
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
