// A vonaldiagram (fejlődési analitika) segédfüggvényei
import { calcTestXp, getDaysSinceSchoolYearStart } from "./profileUtils";

// ----------------- VONALDIAGRAM TENGELYEI ---------------- //
export const CHART = { xMin: 65, xMax: 870, yTop: 30, yBottom: 240, yIntervals: 5 };
const X_TICK_STEP = { "7d": 1, "30d": 5, term: 14 }; // napokban

const getRangeDays = (timeRange) =>
    timeRange === "term" ? getDaysSinceSchoolYearStart() : parseInt(timeRange, 10);

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const getBucketStep = (timeRange) => X_TICK_STEP[timeRange] ?? 1;

// Bucket sorszám (0 = legrégebbi) → x pozíció: az első a bal, az utolsó a jobb szélen áll
const bucketX = (index, count) =>
    count > 1
        ? CHART.xMin + (index / (count - 1)) * (CHART.xMax - CHART.xMin)
        : (CHART.xMin + CHART.xMax) / 2;

// Bucketek: [0] = a legutóbbi (a mai napot tartalmazó), [count-1] = a legrégebbi
export const aggregateByBucket = (tests, timeRange) => {
    const totalDays = getRangeDays(timeRange);
    const step = getBucketStep(timeRange);
    const today = startOfDay(new Date());

    const buckets = Array.from({ length: Math.ceil(totalDays / step) }, () => ({
        xp: 0, tasks: 0, earned: 0, max: 0,
    }));

    tests.forEach((t) => {
        const daysAgo = Math.round((today - startOfDay(new Date(t.datum))) / 86400000);
        if (daysAgo < 0 || daysAgo >= totalDays) return; // időszakon kívül

        const b = buckets[Math.floor(daysAgo / step)];
        b.xp += calcTestXp(t);
        b.tasks += t.feladatok_szama;
        b.earned += t.elert_pont;
        b.max += t.max_pont;
    });

    return buckets;
};

export const buildChartPoints = (buckets, timeRange, yAxis) => {
    const totalDays = getRangeDays(timeRange);
    const step = getBucketStep(timeRange);
    const today = startOfDay(new Date());
    const fmt = (d) => d.toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
    const daysBack = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);

    const points = [];
    for (let k = buckets.length - 1; k >= 0; k--) { // legrégebbi → legújabb
        const b = buckets[k];
        const end = daysBack(k * step);
        const start = daysBack(Math.min((k + 1) * step - 1, totalDays - 1));

        points.push({
            x: bucketX(buckets.length - 1 - k, buckets.length),
            y: CHART.yBottom - (b.xp / yAxis.top) * (CHART.yBottom - CHART.yTop),
            date: step === 1 ? fmt(end) : `${fmt(start)} – ${fmt(end)}`,
            score: `${b.xp} XP`,
            tasks: `${b.tasks} feladat`,
            accuracy: b.max ? `${Math.round((b.earned / b.max) * 100)}%` : "–",
        });
    }
    return points;
};

// Alsó tengely: bucketenként egy címke (a bucket utolsó napja), ugyanott, ahol a pont áll
export const buildXAxis = (timeRange) => {
    const totalDays = getRangeDays(timeRange);
    const step = getBucketStep(timeRange);
    const count = Math.ceil(totalDays / step);
    const today = startOfDay(new Date());

    const ticks = Array.from({ length: count }, (_, i) => {
        const k = count - 1 - i; // hány bucketnyire van a mai naptól
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - k * step);

        return {
            x: bucketX(i, count),
            dayIndex: i,
            label: date.toLocaleDateString("hu-HU", { month: "short", day: "numeric" }),
        };
    });

    return { totalDays, ticks };
};

// Bal tengely: "szép" lépésköz (1, 2, 2.5, 5, 10 × 10^n), 5 egyenlő sáv
const getNiceStep = (maxValue, intervals) => {
    if (maxValue <= 0) return 1;
    const raw = maxValue / intervals;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    const normalized = raw / magnitude;
    const nice = [1, 2, 3, 4, 5, 10].find((n) => normalized <= n);
    return nice * magnitude;
};

const formatAxisValue = (v) =>
    v >= 1000 ? `${Number((v / 1000).toFixed(1))}k` : String(Number(v.toFixed(1)));

export const buildYAxis = (maxValue) => {
    const step = getNiceStep(maxValue, CHART.yIntervals);
    const top = step * CHART.yIntervals;

    const ticks = Array.from({ length: CHART.yIntervals + 1 }, (_, i) => ({
        value: step * i,
        label: formatAxisValue(step * i),
        y: CHART.yBottom - (i / CHART.yIntervals) * (CHART.yBottom - CHART.yTop),
    }));

    return { top, ticks };
};

// Lineáris interpoláció: a régi vonal y értéke egy adott x-nél (animációhoz)
export const sampleY = (points, x) => {
    if (!points.length) return null;
    if (x <= points[0].x) return points[0].y;
    for (let i = 1; i < points.length; i++) {
        if (x <= points[i].x) {
            const a = points[i - 1];
            const b = points[i];
            return a.y + (b.y - a.y) * ((x - a.x) / ((b.x - a.x) || 1));
        }
    }
    return points[points.length - 1].y;
};

const VIEW_W = 920;
const VIEW_H = 280;
export const TOOLTIP_W = 170;

export const getSvgScale = (rect) => {
    const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
    return {
        scale,
        offsetX: (rect.width - VIEW_W * scale) / 2,
        offsetY: (rect.height - VIEW_H * scale) / 2,
    };
};