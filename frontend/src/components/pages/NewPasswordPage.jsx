import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from '../../lib/supabaseClient';

const passwordRequirements = [
    {
        key: "length",
        label: "8–12 karakter hosszú",
        test: (password) => password.length >= 8 && password.length <= 12,
    },
    {
        key: "uppercase",
        label: "Legalább egy nagybetű (A-Z)",
        test: (password) => /[A-Z]/.test(password),
    },
    {
        key: "lowercase",
        label: "Legalább egy kisbetű (a-z)",
        test: (password) => /[a-z]/.test(password),
    },
    {
        key: "number",
        label: "Legalább egy szám (0-9)",
        test: (password) => /[0-9]/.test(password),
    },
    {
        key: "special",
        label: "Legalább egy írásjel (pl. ! ? . , @)",
        test: (password) => /[^A-Za-z0-9]/.test(password),
    },
];

function translateAuthError(err) {
    switch (err?.code) {
        case "same_password":
            return "Az új jelszó nem egyezhet meg a régivel.";
        case "weak_password":
            return "A jelszó túl gyenge a szerver szerint. Válassz erősebbet.";
        case "otp_expired":
        case "session_not_found":
        case "session_expired":
            return "A jelszó-visszaállító hivatkozás lejárt vagy már felhasználták. Kérj új jelszó-visszaállító e-mailt.";
        default:
            return err?.message || "Nem sikerült megváltoztatni a jelszót. Próbáld újra később.";
    }
}

export default function ResetPasswordPage({
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
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Az e-mailből érkező linkből csak a token_hash-t olvassuk ki.
    // Session nem jön létre, amíg a felhasználó el nem küldi az új jelszót.
    const [linkInfo] = useState(() => {
        const query = new URLSearchParams(window.location.search);
        const tokenHash = query.get("token_hash");

        return {
            tokenHash,
            isRecoveryLink: query.get("type") === "recovery" && !!tokenHash,
        };
    });

    const verifiedRef = useRef(false);        // lefutott-e már a verifyOtp
    const passwordChangedRef = useRef(false); // sikerült-e a jelszócsere

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
            return { label: "Gyenge", color: "bg-red-500", textColor: "text-red-500" };
        }

        if (strength === 2) {
            return { label: "Közepes", color: "bg-amber-500", textColor: "text-amber-600" };
        }

        if (strength === 3) {
            return { label: "Jó", color: "bg-primary", textColor: "text-primary" };
        }

        return {
            label: "Kiváló / Erős",
            color: "bg-primary-container",
            textColor: "text-primary-container",
        };
    }, [password, strength]);

    const isPasswordValid = strength === passwordRequirements.length;

    // Ha nincs érvényes formátumú recovery link: főoldalra
    useEffect(() => {
        if (!linkInfo.isRecoveryLink) {
            window.location.replace("/");
        }
    }, [linkInfo]);

    // Ha a verifyOtp sikerült, de a jelszócsere nem, az oldal elhagyásakor
    // kiléptetjük a felhasználót, hogy ne maradjon jelszó nélküli session.
    useEffect(() => {
        const cleanup = () => {
            if (verifiedRef.current && !passwordChangedRef.current) {
                supabase.auth.signOut({ scope: "local" });
            }
        };

        window.addEventListener("pagehide", cleanup);
        return () => {
            window.removeEventListener("pagehide", cleanup);
            cleanup();
        };
    }, []);

    // Átirányítás visszaszámlálással
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

        if (!linkInfo.isRecoveryLink) {
            setError("A jelszó-visszaállító hivatkozás érvénytelen vagy hiányos. Kérj új jelszó-visszaállító e-mailt.");
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

        try {
            setLoading(true);

            // 1. Token beváltása: csak most jön létre a session
            if (!verifiedRef.current) {
                const { error: otpError } = await supabase.auth.verifyOtp({
                    token_hash: linkInfo.tokenHash,
                    type: "recovery",
                });

                if (otpError) throw otpError;
                verifiedRef.current = true;
            }

            // 2. Új jelszó beállítása
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) throw updateError;

            passwordChangedRef.current = true;

            // 3. Az összes többi munkamenet kiléptetése (a mostani megmarad)
            if (logoutOthers) {
                const { error: signOutError } = await supabase.auth.signOut({
                    scope: "others",
                });

                // A jelszó már megváltozott, ezért ez nem állítja meg a folyamatot
                if (signOutError) {
                    console.warn("Más munkamenetek kiléptetése sikertelen:", signOutError.message);
                }
            }

            setSuccess(true);
            setCountdown(3);
        } catch (err) {
            setError(translateAuthError(err));
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
                                    <label
                                        htmlFor="newPassword"
                                        className="block text-sm font-medium mb-2 text-primary"
                                    >
                                        Új jelszó
                                    </label>

                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/50">
                                            lock
                                        </span>

                                        <input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            value={password}
                                            maxLength={12}
                                            onChange={(event) => {
                                                setPassword(event.target.value);
                                                setError("");
                                            }}
                                            onFocus={() => setPasswordFocused(true)}
                                            onBlur={() => setPasswordFocused(false)}
                                            placeholder="••••••••"
                                            disabled={success}
                                            className="w-full pl-11 pr-12 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-60 text-gray-900 dark:text-white placeholder:text-gray-400"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((previous) => !previous)}
                                            aria-label={showPassword ? "Jelszó elrejtése" : "Jelszó felfedése"}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-primary/50 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Követelmények */}
                                    {(passwordFocused || (password.length > 0 && !isPasswordValid)) && (
                                        <ul className="mt-3 space-y-1.5">
                                            {requirements.map((requirement) => (
                                                <li
                                                    key={requirement.key}
                                                    className={`flex items-center gap-2 text-xs transition-colors ${requirement.valid ? "text-green-600" : "text-gray-400"
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {requirement.valid ? "check_circle" : "radio_button_unchecked"}
                                                    </span>
                                                    {requirement.label}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                {/* Jelszó megerősítése */}
                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-medium mb-2 text-primary"
                                    >
                                        Új jelszó megerősítése
                                    </label>

                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/50">
                                            lock
                                        </span>

                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            maxLength={12}
                                            onChange={(event) => {
                                                setConfirmPassword(event.target.value);
                                                setError("");
                                            }}
                                            placeholder="••••••••"
                                            disabled={success}
                                            className="w-full pl-11 pr-12 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-60 text-gray-900 dark:text-white placeholder:text-gray-400"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((previous) => !previous)}
                                            aria-label={showConfirmPassword ? "Jelszó elrejtése" : "Jelszó felfedése"}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-primary/50 hover:text-primary transition-colors"
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
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-2">

                        <span className="text-[10px] text-[#A49BAD]">
                            TudásTér · Fiókkezelés
                        </span>
                    </div>
                </div>
            </main>
        </div>
    );
}
