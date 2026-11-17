
import { useEffect, useState } from "react";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submittedEmail, setSubmittedEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [secondsLeft, setSecondsLeft] = useState(45);

    const isValidEmail = (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    // Visszaszámláló
    useEffect(() => {
        if (!success || secondsLeft <= 0) return;

        const timer = setTimeout(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [success, secondsLeft]);

    // E-mail ellenőrzése
    const handleEmailChange = (value) => {
        setEmail(value);

        if (emailError) {
            setEmailError("");
        }
    };

    // Űrlap beküldése
    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedEmail = email.trim();

        if (!isValidEmail(trimmedEmail)) {
            setEmailError("Kérlek, érvényes e-mail-címet adj meg.");
            return;
        }

        setEmailError("");
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSubmittedEmail(trimmedEmail);
            setSuccess(true);
            setSecondsLeft(45);
        } catch (error) {
            setEmailError("Nem sikerült elküldeni a visszaállító linket.");
        } finally {
            setLoading(false);
        }
    };

    // E-mail módosítása
    const handleEditEmail = () => {
        setSuccess(false);
        setEmailError("");
    };

    // Újraküldés
    const handleResend = async () => {
        if (secondsLeft > 0 || loading) return;

        setLoading(true);

        try {
          const { error } = await supabase.auth.resetPasswordForEmail(
            submittedEmail,
            {
              redirectTo: `${window.location.origin}/reset-password`,
            },
          );

          if (error) throw error;

          setSecondsLeft(45);
        } catch {
          setEmailError("Az újraküldés nem sikerült.");
        } finally {
          setLoading(false);
        }
    };

    

    return (
        <div className="min-h-screen flex flex-col bg-[#F4F2F8] text-[#24123D] font-display">

            {/* FEJLÉC */}

            {/* FŐ TARTALOM */}
            <main className="flex-1 flex items-center justify-center px-4 pt-32 pb-12 sm:pt-36 sm:pb-16 relative overflow-hidden">
                {/* Háttér dekoráció */}
                <div className="absolute top-10 left-0 w-80 h-80 rounded-full bg-[#4B2A7F]/10 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#351F5B]/10 blur-[110px] pointer-events-none" />

                <div className="w-full max-w-lg relative z-10">

                    {/* KÁRTYA */}
                    <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(53,31,91,0.10)] border border-[#351F5B]/10 overflow-hidden">

                        <div className="h-1.5 bg-gradient-to-r from-[#24123D] via-[#4B2A7F] to-[#B49BD8]" />

                        <div className="p-6 sm:p-9">

                            {/* Cím */}
                            <div className="flex flex-col items-center text-center">

                                <div className="relative mb-5">
                                    <div className="w-16 h-16 rounded-2xl bg-[#351F5B] flex items-center justify-center shadow-lg shadow-[#351F5B]/20">
                                        <span className="material-symbols-outlined text-white text-3xl">
                                            lock_reset
                                        </span>
                                    </div>

                                </div>

                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7654A5] mb-2">
                                    TudásTér fiókkezelés
                                </span>

                                <h1 className="text-2xl sm:text-3xl font-bold text-[#351F5B] mb-3">
                                    Új jelszó kérése
                                </h1>

                                <p className="text-sm text-[#756B83] leading-relaxed max-w-md">
                                    Semmi gond! Add meg a TudásTér fiókodhoz
                                    tartozó e-mail-címed, és elküldjük a
                                    visszaállításhoz szükséges linket.
                                </p>
                            </div>

                            {/* SIKERES KÜLDÉS */}
                            {success && (
                                <div className="mt-7 p-4 rounded-xl bg-[#F4F2F8] border border-[#351F5B]/15 animate-[fadeIn_0.3s_ease-out]">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#351F5B] text-white flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-lg">
                                                mark_email_read
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-sm font-bold text-[#351F5B]">
                                                    Ellenőrizd a postafiókod!
                                                </h3>

                                            </div>

                                            <p className="text-xs text-[#756B83] mt-2 leading-relaxed">
                                                A visszaállító linket erre a címre
                                                küldenénk:
                                            </p>

                                            <p className="text-sm font-semibold text-[#351F5B] mt-1 break-all">
                                                {submittedEmail}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                                <button
                                                    type="button"
                                                    disabled={secondsLeft > 0 || loading}
                                                    onClick={handleResend}
                                                    className="flex items-center gap-1.5 rounded-lg bg-[#EAE5F1] text-[#351F5B] px-3 py-2 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#DDD4E9] transition-colors"
                                                >
                                                    <span className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}>
                                                        refresh
                                                    </span>

                                                    {loading
                                                        ? "Küldés..."
                                                        : secondsLeft > 0
                                                            ? `Újraküldés (${secondsLeft} mp)`
                                                            : "Újraküldés most"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleEditEmail}
                                                    className="text-xs font-semibold text-[#7654A5] hover:text-[#351F5B] transition-colors"
                                                >
                                                    Módosítás
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ŰRLAP */}
                            {!success && (
                                <form
                                    onSubmit={handleSubmit}
                                    className="mt-8 space-y-6"
                                    noValidate
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <label
                                                htmlFor="reset-email"
                                                className="text-sm font-semibold text-[#35284B]"
                                            >
                                                E-mail-cím
                                                <span className="text-red-500 ml-1">*</span>
                                            </label>

                                        </div>

                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/50">
                                                alternate_email
                                            </span>

                                            <input
                                                id="reset-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => handleEmailChange(e.target.value)}
                                                placeholder="pelda@email.hu"
                                                autoComplete="email"
                                                className={`w-full pl-11 pr-12 py-3 bg-primary/5 border rounded-xl focus:ring-2 outline-none transition-all ${emailError
                                                        ? "border-red-400 focus:ring-red-300"
                                                        : "border-primary/20 focus:ring-primary"
                                                    }`}
                                            />

                                            {email.trim() && isValidEmail(email.trim()) && (
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xl">
                                                    check_circle
                                                </span>
                                            )}
                                        </div>

                                        {emailError && (
                                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">
                                                    error
                                                </span>
                                                {emailError}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#351F5B] hover:bg-[#24123D] text-white font-bold text-sm py-4 px-5 shadow-lg shadow-[#351F5B]/20 hover:shadow-xl hover:shadow-[#351F5B]/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 group"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin text-xl">
                                                    progress_activity
                                                </span>
                                                Küldés folyamatban...
                                            </>
                                        ) : (
                                            <>
                                                Visszaállító link küldése
                                                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                                                    arrow_forward
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* VISSZA A BEJELENTKEZÉSHEZ */}
                            <div className="mt-7 flex flex-col items-center gap-3">
                                <a
                                    href="/bejelentkezes"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#4B2A7F] hover:text-[#24123D] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        keyboard_backspace
                                    </span>
                                    Vissza a bejelentkezéshez
                                </a>

                            </div>
                        </div>

                        {/* INFORMÁCIÓS SÁV */}
                        <div className="bg-[#F8F6FB] border-t border-[#351F5B]/10 px-6 sm:px-9 py-5">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-[#7654A5] text-xl shrink-0">
                                    info
                                </span>

                                <p className="text-xs text-[#756B83] leading-relaxed">
                                    <span className="font-bold text-[#35284B]">
                                        Nem kaptad meg a levelet?
                                    </span>{" "}
                                    Nézd meg a Promóciók vagy a
                                    Spam mappát, vagy írj nekünk:
                                    <a
                                        href="mailto:tamogatas@tudaster.hu"
                                        className="block sm:inline-block sm:ml-1 text-[#4B2A7F] font-bold hover:underline"
                                    >
                                        radomemail
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>

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

export default ForgotPasswordPage;
