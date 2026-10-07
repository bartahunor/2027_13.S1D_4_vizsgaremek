import { useEffect, useState } from "react";
import { apiFetch } from '../../lib/apiClient';
import ProfileHeader from "../sections/profile/ProfileHeader";
import ProgressAnalytics from "../sections/profile/ProgressAnalytics";
import SubjectPieChart from "../sections/profile/SubjectPieChart";
import ActivityCalendar from "../sections/profile/ActivityCalendar";
import ActivityLog from "../sections/profile/ActivityLog";

function ProfileTwoPage() {

    const [profildata, setProfildata] = useState([]);
    const [pieStats, setPieStats] = useState([]);
    const [calendarStats, setCalendarStats] = useState([]);
    const [tabSubjects, setTabSubjects] = useState(["Mind"]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadStaticData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [profil, pie, calendar] = await Promise.all([
                    apiFetch('/profilroutes/me'),
                    apiFetch('/profilroutes/me/piechart'),
                    apiFetch('/profilroutes/me/calendar'),
                ]);

                if (cancelled) return;
                setProfildata(profil);
                setPieStats(pie);
                setCalendarStats(calendar);
                setTabSubjects(["Mind", ...new Set(pie.map((p) => p.tantargy))]);
            } catch (err) {
                if (cancelled) return;
                setError("Nem sikerült betölteni az adatokat.");
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadStaticData();
        return () => { cancelled = true; };
    }, []);

    return (
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 bg-transparent flex-grow">
            <div className="flex flex-col w-full pb-10">

                <ProfileHeader profildata={profildata} />

                <ProgressAnalytics tabSubjects={tabSubjects} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">

                    <SubjectPieChart pieStats={pieStats} />

                    <ActivityCalendar calendarStats={calendarStats} />

                    <ActivityLog tabSubjects={tabSubjects} />

                </div>

            </div>
        </main>
    );
}

export default ProfileTwoPage;