import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import { supabase } from  '../../lib/supabaseClient';
import LogoFeher from '../../assets/logofeher.png';

function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        szerep: 'diak'
    });

    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    function getPasswordRequirements(password) {
        return {
            length: password.length >= 8 && password.length <= 12,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            punctuation: /[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]/.test(password)
        }
    }

    const passwordRequirements = getPasswordRequirements(formData.password)
    const isPasswordValid = Object.values(passwordRequirements).every(Boolean)

    function handleInputChange(e) {
        setFormData((prevData) => {
            return{
                ...prevData,
                [e.target.name]: e.target.value
            }
            
        });
    }

    // Felhasználónév foglaltság ellenőrzése
    async function isUsernameTaken(username) {
        const { data, error } = await supabase.rpc('felhasznalonev_foglalt', {
            nev: username
        })

        if (error) {
            console.error('Hiba a felhasználónév ellenőrzése közben:', error.message)
            throw error
        }

        return data // true vagy false
    }

    // Regisztráció
    async function handleSignUp(email, password, username, szerep) {
        const trimmedNev = username?.trim()

        if (!trimmedNev) {
            return { success: false, error: { message: 'A felhasználónév megadása kötelező.' } }
        }

        try {
            const taken = await isUsernameTaken(trimmedNev)
            if (taken) {
                return { success: false, error: { message: 'Ez a felhasználónév már foglalt.' } }
            }
        } catch (err) {
            return { success: false, error: { message: 'Nem sikerült ellenőrizni a felhasználónevet. Próbáld újra.' } }
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    felhasznalonev: trimmedNev,
                    szerep: szerep
                }
            }
        })

        if (error) {
            console.error('Regisztrációs hiba:', error.message)
            return { success: false, error }
        }

        return { success: true, data }
    }

    async function onSubmit(e) {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)

        if (!isPasswordValid) {
            setError('A jelszó nem felel meg a követelményeknek.')
            return
        }

        if (formData.password !== formData.password_confirm) {
            setError('A jelszavak nem egyeznek.')
            return
        }

        setLoading(true)
        const result = await handleSignUp(formData.email, formData.password, formData.username, formData.szerep)
        setLoading(false)

        if (!result.success) {
            setError(result.error.message)
            return
        }

        setSuccessMessage('Sikeres regisztráció! Ellenőrizd az emailedet a megerősítéshez.')
    }
    

    return (
        <div className="min-h-screen pt-20 bg-grid-pattern font-display min-h-screen flex items-center justify-center">
            <main
                className="w-full max-w-[1200px] min-h-[720px] flex overflow-hidden rounded-2xl shadow-2xl m-4 bg-white dark:bg-backgroundDark border border-primary/20">

                <div
                    className="hidden lg:flex flex-col justify-between w-1/2 p-12 auth-gradient text-white relative">

                    <div className="relative z-10">

                        <div className="flex items-center">
                            <img
                                src={LogoFeher}
                                alt="Tudástér logó"
                                className="w-[30%] mb-12"
                            />
                        </div>

                        <h1 className="text-5xl font-bold leading-tight mb-6">
                            Csatlakozz hozzánk!
                        </h1>

                        <p className="text-lg text-white/80 max-w-md leading-relaxed">
                            Készülj fel sikeresen az érettségire velünk.
                            Minden tananyag és teszt egy helyen, hogy a legtöbbet hozd ki magadból.
                        </p>

                    </div>

                    <div className="relative z-10 flex items-center gap-4 text-sm text-white/60">
                        <span>© 2026 Tudástér</span>
                        <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                        <a href="#" className="hover:text-white transition-colors">Adatvédelem</a>
                    </div>

                    <div
                        className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl">
                    </div>

                    <div
                        className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-primaryLight/30 rounded-full blur-3xl">
                    </div>

                </div>


                <div
                    className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 py-12 bg-white dark:bg-backgroundDark">

                    <div className="max-w-md w-full mx-auto">

                        <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                            <span className="material-icons text-3xl text-primary">school</span>
                            <span className="text-2xl font-bold text-primary">
                                Tudástér
                            </span>
                        </div>

                        <div className="mb-10 text-center lg:text-left">
                            <h2 id="form-title" className="text-3xl font-bold text-primary mb-2">
                                Regisztráció
                            </h2>
                            <p id="form-subtitle" className="text-gray-500 dark:text-gray-400">
                                Hozd létre a fiókodat, hogy elkezdhesd a tanulást
                            </p>
                        </div>

                        {(error || successMessage) && (
                            <div
                                role="alert"
                                className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2 ${
                                    error
                                        ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400'
                                        : 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base mt-0.5">
                                    {error ? 'error' : 'check_circle'}
                                </span>
                                <span>{error || successMessage}</span>
                            </div>
                        )}

                        <form id="auth-form" className="space-y-6" onSubmit={onSubmit}>

                            <div id="username-container">
                                <label htmlFor="username" className="block text-sm font-medium mb-2 text-primary">
                                    Felhasználónév
                                </label>
                                <div className="relative">
                                    <span
                                        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/50">
                                        person
                                    </span>
                                    <input
                                        id="username"
                                        type="text"
                                        name="username"
                                        placeholder="Felhasználónév"
                                        required
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            <div id="szerep-container">
                                <label className="block text-sm font-medium mb-2 text-primary">
                                    Fiók típusa
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, szerep: 'diak' }))}
                                        className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border transition-all ${
                                            formData.szerep === 'diak'
                                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                : 'border-primary/20 bg-primary/5 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined">school</span>
                                        Diák
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, szerep: 'tanar' }))}
                                        className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border transition-all ${
                                            formData.szerep === 'tanar'
                                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                : 'border-primary/20 bg-primary/5 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined">cast_for_education</span>
                                        Tanár
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-2 text-primary">
                                    Email cím
                                </label>
                                <div className="relative">
                                    <span
                                        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/50">
                                        alternate_email
                                    </span>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="pelda@email.hu"
                                        required
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            <div id="password-container">
                                <label htmlFor="password" className="block text-sm font-medium mb-2 text-primary">
                                    Jelszó
                                </label>
                                <div className="relative">
                                    <span
                                        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/50">
                                        lock
                                    </span>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        maxLength={12}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        className="w-full pl-11 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    />
                                </div>

                                {(passwordFocused || (formData.password.length > 0 && !isPasswordValid)) && (
                                    <ul className="mt-3 space-y-1.5">
                                        {[
                                            { key: 'length', label: '8–12 karakter hosszú' },
                                            { key: 'uppercase', label: 'Legalább egy nagybetű (A-Z)' },
                                            { key: 'lowercase', label: 'Legalább egy kisbetű (a-z)' },
                                            { key: 'number', label: 'Legalább egy szám (0-9)' },
                                            { key: 'punctuation', label: 'Legalább egy írásjel (pl. ! ? . , @)' }
                                        ].map(({ key, label }) => {
                                            const met = passwordRequirements[key]
                                            return (
                                                <li
                                                    key={key}
                                                    className={`flex items-center gap-2 text-xs transition-colors ${
                                                        met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {met ? 'check_circle' : 'radio_button_unchecked'}
                                                    </span>
                                                    {label}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </div>

                            <div id="password-confirm-container">
                                <label htmlFor="password-confirm" className="block text-sm font-medium mb-2 text-primary">
                                    Jelszó megerősítése
                                </label>
                                <div className="relative">
                                    <span
                                        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/50">
                                        lock
                                    </span>
                                    <input
                                        id="password-confirm"
                                        name="password_confirm"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            <div id="terms-container" className="flex items-center">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    required
                                    className="h-4 w-4 text-primary focus:ring-primary border-primary/30 rounded"
                                />
                                <label htmlFor="terms" className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                    Elfogadom az{' '}
                                    <a href="#" className="text-primary font-semibold hover:underline">
                                        Általános Szerződési Feltételeket
                                    </a>
                                </label>
                            </div>

                            <button
                                type="submit"
                                id="submit-btn"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primaryLight text-white font-bold py-3.5 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Folyamatban...' : 'Regisztráció'}
                            </button>
                        </form>

                        <div className="mt-10 text-center">
                            <p className="text-gray-600 dark:text-gray-400" id="switch-text">
                                Van már fiókod?{' '}
                                <Link to="/login" id="switch-link" className="text-primary font-bold hover:underline ml-1">
                                    Jelentkezz be!
                                </Link>
                            </p>
                        </div>

                    </div>
                </div>

            </main>

        </div>
    )
}

export default RegisterPage;