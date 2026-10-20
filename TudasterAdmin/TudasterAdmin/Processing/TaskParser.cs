using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace TudasterAdmin.Processing
{
    internal class ExamInfo
    {
        public string Subject { get; set; } = "";
        public string Level { get; set; } = "";
        public string Date { get; set; } = "";
        public string ExamCode { get; set; } = "";
    }

    internal class TaskParser
    {
        private class Page
        {
            public int Number;
            public string Text = "";
        }

        private static readonly string[] Subjects =
        {
            "magyar nyelv és irodalom", "matematika", "történelem",
            "angol nyelv", "német nyelv", "francia nyelv", "olasz nyelv",
            "orosz nyelv", "spanyol nyelv", "biológia", "fizika", "kémia",
            "földrajz", "informatika", "társadalmi ismeretek", "filozófia",
            "ének-zene", "vizuális kultúra", "testnevelés"
        };

        // Ha egy oldalon ezekből legalább 3 van, az címoldal / tudnivalók / pontozótábla.
        private static readonly string[] FillerMarkers =
        {
            "azonosító jel", "az írásbeli vizsga időtartama", "fontos tudnivalók",
            "tölti ki", "elért pontszám", "maximális pontszám", "javító tanár"
        };

        private static readonly Regex PageMarkerRx =
            new Regex(@"\[\[PDF_OLDAL_(\d+)\]\]", RegexOptions.CultureInvariant);

        // Feladatra utaló szavak: ha a szám után nincs ilyen, akkor nem feladatkezdet.
        private static readonly Regex CueRx = new Regex(
            @"\b(írja|írjon|írják|adja|adjon|határozza|döntse|döntsön|válassza|jelölje|egészítse|töltse|nevezze|nevezzen|sorolja|soroljon|indokolja|magyarázza|mutassa|mutasson|ismertesse|értelmezze|hasonlítsa|elemezze|számítsa|számolja|oldja|ábrázolja|rajzolja|bizonyítsa|igazolja|olvassa|állapítsa|keresse|keressen|párosítsa|rendelje|karikázza|húzza|fogalmazza|vezesse|tegye|szerkessze|válaszoljon|fejtse|vizsgálja|jellemezze|értékelje|melyik|miért|hány|mekkora)\w*|\?|\bpont\)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        // "1. forrás", "2. ábra" stb. nem feladat.
        private static readonly Regex LabelRx = new Regex(
            @"^\d{1,2}\.\s*(forrás|ábra|táblázat|kép|térkép|szöveg|melléklet)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        private static readonly Regex TaskStartRx =
            new Regex(@"(?<!\S)(\d{1,2})\.\s+(?=\S)", RegexOptions.CultureInvariant);

        // Csak kisbetűs "a)", "b)" ... (a nagybetűs A) B) C) a feleletválasztós opció)
        private static readonly Regex SubStartRx =
            new Regex(@"(?<!\S)([a-h])\)\s*(?=\S)", RegexOptions.CultureInvariant);

        // ------------------------------------------------------------------
        // Vizsgatípus felismerése (a nyers szövegen hívd meg)
        // ------------------------------------------------------------------
        public ExamInfo DetectExam(string rawText)
        {
            var info = new ExamInfo();
            if (string.IsNullOrWhiteSpace(rawText)) return info;

            string head = rawText.Substring(0, Math.Min(3000, rawText.Length));
            string lower = head.ToLowerInvariant();

            info.Subject = Subjects
                .Where(s => lower.Contains(s))
                .OrderByDescending(s => s.Length)
                .FirstOrDefault() ?? "";

            if (Regex.IsMatch(lower, @"emelt\s*szint")) info.Level = "emelt";
            else if (Regex.IsMatch(lower, @"közép\s*szint")) info.Level = "közép";

            var date = Regex.Match(head,
                @"\b(20\d{2})\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s+(\d{1,2})\.",
                RegexOptions.IgnoreCase);
            if (date.Success) info.Date = date.Value;

            var code = Regex.Match(head, @"\b(\d{4})\s+írásbeli vizsga", RegexOptions.IgnoreCase);
            if (code.Success) info.ExamCode = code.Groups[1].Value;

            return info;
        }

        // ------------------------------------------------------------------
        // Feladatok darabolása
        // ------------------------------------------------------------------
        public List<ParsedTask> ParseTasks(string extractedText)
        {
            var tasks = new List<ParsedTask>();
            if (string.IsNullOrWhiteSpace(extractedText))
                return tasks;

            string raw = extractedText.Replace("\r\n", "\n").Replace('\r', '\n');

            // 1) Oldalakra bontás, alap tisztítás, ismétlődő fejléc/lábléc törlése
            var pages = SplitPages(raw);
            foreach (var p in pages) p.Text = CleanPage(p.Text);
            RemoveRepeatedLines(pages);

            // 2) Töltelék oldalak kiszűrése
            var kept = new List<Page>();
            var skipped = new List<int>();
            foreach (var p in pages)
            {
                if (IsFillerPage(p)) skipped.Add(p.Number);
                else kept.Add(p);
            }

            // 3) Oldalankénti szerkezetelés (válaszsorok, táblázatok), majd összefűzés
            var sb = new StringBuilder();
            var offsets = new List<(int Start, int Page)>();
            foreach (var p in kept)
            {
                offsets.Add((sb.Length, p.Number));
                sb.Append(StructureLines(p.Text));
                sb.Append('\n');
            }
            string text = sb.ToString();

            // A javítási / pontozó rész levágása (csak a szöveg második felében)
            int cut = text.LastIndexOf("az értékelő tanár tölti ki", StringComparison.OrdinalIgnoreCase);
            if (cut > text.Length / 2) text = text.Substring(0, cut);

            if (offsets.Count == 0) return tasks;

            int PageAt(int idx)
            {
                int pg = offsets[0].Page;
                foreach (var o in offsets)
                {
                    if (o.Start <= idx) pg = o.Page;
                    else break;
                }
                return pg;
            }

            // 4) Feladatkezdetek: 1, 2, 3 ... sorrend + feladatra utaló szó a közelben
            var cands = TaskStartRx.Matches(text)
                .Cast<Match>()
                .Select(m => (Number: int.Parse(m.Groups[1].Value), Index: m.Index))
                .ToList();

            var starts = new List<(int Number, int Index)>();
            int expected = 1;
            for (int k = 0; k < cands.Count && expected <= 40; k++)
            {
                var c = cands[k];
                if (c.Number != expected) continue;

                int next = k + 1 < cands.Count ? cands[k + 1].Index : text.Length;
                string window = text.Substring(c.Index, Math.Min(400, next - c.Index));

                if (LabelRx.IsMatch(window)) continue;   // "1. forrás", "2. ábra"
                if (!CueRx.IsMatch(window)) continue;    // nincs feladatra utaló szó

                starts.Add(c);
                expected++;
            }

#if DEBUG
            Debug.WriteLine($"Oldalak: {pages.Count}, kihagyott: [{string.Join(",", skipped)}], " +
                            $"jelöltek: {cands.Count}, felismert feladat: {starts.Count}");
#endif

            // 5) Feladatok összeállítása
            for (int i = 0; i < starts.Count; i++)
            {
                int start = starts[i].Index;
                int end = i + 1 < starts.Count ? starts[i + 1].Index : text.Length;

                string taskText = text.Substring(start, end - start).Trim();
                if (taskText.Length < 8) continue;

                var (stem, subs) = SplitSubQuestions(taskText);
                var (mainText, sourceText) = SplitSource(stem);

                string type = DetectTaskType(taskText, subs);
                int? points = ExtractPoints(taskText);
                bool hasTable = taskText.Contains("[TABLAZAT]");
                int answerLines = Regex.Matches(taskText, @"\[VALASZSOR:(\d+)\]")
                    .Cast<Match>().Sum(m => int.Parse(m.Groups[1].Value));

                int confidence =
                    (points != null ? 1 : 0) +
                    (taskText.Length >= 40 ? 1 : 0) +
                    (subs.Count > 0 || type != "rovid_valasz" ? 1 : 0);

                tasks.Add(new ParsedTask
                {
                    Number = starts[i].Number,
                    Title = starts[i].Number + ". feladat",
                    Text = mainText,
                    SourceText = sourceText,
                    SubQuestions = subs,
                    Points = points,
                    TypeName = type,
                    HasTable = hasTable,
                    AnswerLines = answerLines,
                    PageFrom = PageAt(start),
                    PageTo = PageAt(Math.Max(start, end - 1)),
                    Confidence = confidence,
                    NeedsReview = confidence < 3 || hasTable || sourceText.Length > 0
                });
            }

            return tasks;
        }

        // ------------------------------------------------------------------
        // Oldalkezelés
        // ------------------------------------------------------------------
        // Feltételezés: a [[PDF_OLDAL_n]] jelölő az adott oldal szövege ELŐTT áll.
        private static List<Page> SplitPages(string text)
        {
            var pages = new List<Page>();
            var ms = PageMarkerRx.Matches(text);

            if (ms.Count == 0)
            {
                pages.Add(new Page { Number = 1, Text = text });
                return pages;
            }

            string before = text.Substring(0, ms[0].Index);
            if (!string.IsNullOrWhiteSpace(before))
                pages.Add(new Page { Number = 0, Text = before });

            for (int i = 0; i < ms.Count; i++)
            {
                int s = ms[i].Index + ms[i].Length;
                int e = i + 1 < ms.Count ? ms[i + 1].Index : text.Length;
                pages.Add(new Page
                {
                    Number = int.Parse(ms[i].Groups[1].Value),
                    Text = text.Substring(s, e - s)
                });
            }
            return pages;
        }

        private static bool IsFillerPage(Page p)
        {
            int letters = p.Text.Count(char.IsLetter);
            if (letters < 40) return true;

            string lower = p.Text.ToLowerInvariant();
            if (lower.Contains("üres oldal")) return true;

            return FillerMarkers.Count(m => lower.Contains(m)) >= 3;
        }

        private static string CleanPage(string t)
        {
            t = Regex.Replace(t, @"\b\d{4}\s+írásbeli vizsga(\s+\d{1,2}\s*/\s*\d{1,2})?", "",
                RegexOptions.IgnoreCase);
            t = Regex.Replace(t, @"(?m)^[ \t]*\d{1,2}\s*/\s*\d{1,2}[ \t]*$", "");
            t = Regex.Replace(t, @"Név:\s*\.{3,}", "", RegexOptions.IgnoreCase);
            t = Regex.Replace(t, @"osztály:\s*\.{2,}", "", RegexOptions.IgnoreCase);
            return t;
        }

        // Az oldalak legalább felén megismétlődő sorok (fejléc/lábléc) törlése.
        private static void RemoveRepeatedLines(List<Page> pages)
        {
            if (pages.Count < 4) return;

            var counts = new Dictionary<string, int>();
            foreach (var p in pages)
            {
                var keys = p.Text.Split('\n').Select(NormalizeKey).Where(IsRemovableKey).Distinct();
                foreach (var key in keys)
                    counts[key] = counts.TryGetValue(key, out int c) ? c + 1 : 1;
            }

            int threshold = Math.Max(3, pages.Count / 2);
            foreach (var p in pages)
            {
                var keptLines = p.Text.Split('\n').Where(line =>
                {
                    string k = NormalizeKey(line);
                    return !(IsRemovableKey(k) && counts.TryGetValue(k, out int c) && c >= threshold);
                });
                p.Text = string.Join("\n", keptLines);
            }
        }

        private static string NormalizeKey(string line) =>
            Regex.Replace(Regex.Replace(line.Trim(), @"\d+", "#"), @"\s+", " ");

        private static bool IsRemovableKey(string key) =>
            key.Length >= 12 && key.Length <= 140
            && !key.Contains("pont", StringComparison.OrdinalIgnoreCase)
            && !Regex.IsMatch(key, @"^[a-z]\)")
            && !Regex.IsMatch(key, @"^[.…_\-–· ]+$");

        // ------------------------------------------------------------------
        // Válaszsorok és táblázatok
        // ------------------------------------------------------------------
        private static bool IsDotLine(string line) =>
            Regex.IsMatch(line, @"^[ \t]*[.…_\-–·][ \t.…_\-–·]{4,}$");

        private static List<string> SplitCells(string line) =>
            Regex.Split(line.Trim(), @"\t+| {3,}")
                .Select(c => c.Trim())
                .Where(c => c.Length > 0)
                .ToList();

        private static bool IsTableRow(string line)
        {
            if (IsDotLine(line)) return false;
            var cells = SplitCells(line);
            return cells.Count >= 2 && cells.All(c => c.Length <= 50);
        }

        private static string StructureLines(string text)
        {
            var lines = text.Split('\n');
            var sb = new StringBuilder();
            int i = 0;

            while (i < lines.Length)
            {
                string line = lines[i];

                // Egymás utáni pontozott sorok -> egy jelölő a sorok számával
                if (IsDotLine(line))
                {
                    int n = 0;
                    while (i < lines.Length && IsDotLine(lines[i])) { n++; i++; }
                    sb.Append("[VALASZSOR:").Append(n).Append("]\n");
                    continue;
                }

                // Legalább 2 egymás utáni, oszlopokra tagolt sor -> táblázat
                if (IsTableRow(line))
                {
                    int j = i;
                    var rows = new List<string>();
                    while (j < lines.Length && IsTableRow(lines[j]))
                    {
                        rows.Add(string.Join(" | ", SplitCells(lines[j])));
                        j++;
                    }
                    if (rows.Count >= 2)
                    {
                        sb.Append("[TABLAZAT]\n");
                        foreach (var r in rows) sb.Append(r).Append('\n');
                        sb.Append("[/TABLAZAT]\n");
                        i = j;
                        continue;
                    }
                }

                string clean = Regex.Replace(line, @"\.{4,}|_{3,}|…{2,}", "[___]");
                clean = Regex.Replace(clean, @"[ \t]{2,}", " ").Trim();
                sb.Append(clean).Append('\n');
                i++;
            }

            return sb.ToString();
        }

        // ------------------------------------------------------------------
        // a) b) c) részkérdések és hosszú forrásszöveg
        // ------------------------------------------------------------------
        private static (string Stem, List<string> Subs) SplitSubQuestions(string taskText)
        {
            var picked = new List<Match>();
            char expect = 'a';
            foreach (Match m in SubStartRx.Matches(taskText))
            {
                if (m.Groups[1].Value[0] != expect) continue;
                picked.Add(m);
                expect++;
            }

            if (picked.Count < 2) return (taskText, new List<string>());

            string stem = taskText.Substring(0, picked[0].Index).Trim();
            var subs = new List<string>();
            for (int i = 0; i < picked.Count; i++)
            {
                int s = picked[i].Index;
                int e = i + 1 < picked.Count ? picked[i + 1].Index : taskText.Length;
                subs.Add(taskText.Substring(s, e - s).Trim());
            }
            return (stem, subs);
        }

        // Hosszú (350+ karakter), feladatra utaló szó nélküli bekezdés = forrásszöveg.
        private static (string Text, string Source) SplitSource(string stem)
        {
            var paras = Regex.Split(stem, @"\n\s*\n")
                .Select(p => p.Trim())
                .Where(p => p.Length > 0)
                .ToList();

            if (paras.Count < 2) return (stem, "");

            var textParts = new List<string>();
            var srcParts = new List<string>();
            foreach (var p in paras)
            {
                bool isSource = p.Length >= 350 && !CueRx.IsMatch(p);
                (isSource ? srcParts : textParts).Add(p);
            }

            if (textParts.Count == 0) return (stem, "");
            return (string.Join("\n\n", textParts), string.Join("\n\n", srcParts));
        }

        // ------------------------------------------------------------------
        // Típus és pont
        // ------------------------------------------------------------------
        private static string DetectTaskType(string text, List<string> subQuestions)
        {
            string t = text.ToLowerInvariant();

            if (Regex.IsMatch(t, @"igaz\s+vagy\s+hamis|\bigaz\b.*\bhamis\b"))
                return "igaz_hamis";

            if (Regex.Matches(text, @"(?m)^[ \t]*[A-D][.)]\s+\S").Count >= 3)
                return "feleletvalasztos";

            if (Regex.IsMatch(t, @"párosít|rendelje hozzá|kösse össze"))
                return "parositas";

            if (text.Contains("[TABLAZAT]") ||
                (t.Contains("táblázat") && Regex.IsMatch(t, @"töltse ki|egészítse ki|kitöltés")))
                return "tablazatos";

            if (Regex.IsMatch(t, @"fejtse ki|értekezz|esszé|\d+\s*[–-]\s*\d+\s*mondat|szó terjedelm"))
                return "esszé";

            if (Regex.IsMatch(t, @"számítsa ki|határozza meg|oldja meg|bizonyítsa"))
                return "szamitas";

            return subQuestions.Count > 0 ? "tobbReszes" : "rovid_valasz";
        }

        private static int? ExtractPoints(string taskText)
        {
            var total = Regex.Match(taskText, @"Összesen:\s*(\d+)\s*pont", RegexOptions.IgnoreCase);
            if (total.Success) return int.Parse(total.Groups[1].Value);

            var parts = Regex.Matches(taskText, @"(\d+)\s*pont\b", RegexOptions.IgnoreCase);
            return parts.Count > 0
                ? parts.Cast<Match>().Sum(m => int.Parse(m.Groups[1].Value))
                : (int?)null;
        }
    }
}