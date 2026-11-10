using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace TudasterAdmin.Processing
{
    internal static class AiExamMapper
    {
        public static DraftExam ToDraft(
            AiExamDto exam, string pdfFileName, string? pdfText, IReadOnlyList<TopicInfo> topics)
        {
            var draft = new DraftExam
            {
                SourcePdfName = pdfFileName,
                Subject = exam.Subject,
                TotalPoints = exam.TotalPoints,
                Year = exam.Year ?? ParseYear(exam.Date),
                Level = NormalizeLevel(exam.Level),
                Period = !string.IsNullOrWhiteSpace(exam.Period)
                    ? exam.Period.Trim().ToLowerInvariant()
                    : DetectPeriod(exam.Date)
            };

            if (draft.Year == null)
                draft.Warnings.Add("Az évszám nem ismerhető fel (az ev tábla miatt kötelező).");
            if (draft.Level == "")
                draft.Warnings.Add("A szint nem ismerhető fel.");

            string pdfNorm = pdfText != null
                ? Norm(Regex.Replace(pdfText, @"\[\[PDF_OLDAL_\d+\]\]", " "))
                : "";

            // Ha a modell ugyanarra a szövegre két kulcsot adna, összevonjuk őket.
            var keyMap = new Dictionary<string, string>();      // eredeti kulcs -> végleges kulcs
            var keyByText = new Dictionary<string, string>();   // normalizált szöveg -> végleges kulcs

            foreach (var s in exam.Sources.GroupBy(x => x.Key).Select(g => g.First()))
            {
                string n = Norm(s.Text);
                if (n.Length > 0 && keyByText.TryGetValue(n, out var existing))
                {
                    keyMap[s.Key] = existing;
                    continue;
                }
                keyMap[s.Key] = s.Key;
                if (n.Length > 0) keyByText[n] = s.Key;
                draft.Sources.Add(new DraftSource { Key = s.Key, Text = s.Text });
            }

            var sourceByKey = draft.Sources.ToDictionary(s => s.Key, s => s.Text);
            var topicIds = topics.Select(t => t.Id).ToHashSet();

            var ordered = exam.Tasks.OrderBy(t => t.Number).ToList();

            // --- Globális ellenőrzések ---
            for (int i = 0; i < ordered.Count; i++)
            {
                if (ordered[i].Number != i + 1)
                {
                    draft.Warnings.Add($"A feladatok sorszáma nem folyamatos (hiány vagy ismétlődés a(z) {i + 1}. helyen).");
                    break;
                }
            }

            if (exam.TotalPoints.HasValue && ordered.All(t => t.Points.HasValue))
            {
                int sum = ordered.Sum(t => t.Points!.Value);
                if (sum != exam.TotalPoints.Value)
                    draft.Warnings.Add($"A feladatpontok összege ({sum}) nem egyezik az összpontszámmal ({exam.TotalPoints}).");
            }

            // --- Feladatonként ---
            foreach (var t in ordered)
            {
                t.Table ??= new AiTableDto();
                var taskWarnings = new List<string>();

                // Forrás ellenőrzése: kulcs feloldása + szó szerintiség
                // (a részkérdés saját forrása felülírja a feladatét)
                string? ResolveSource(string? rawKey, List<string> warnings)
                {
                    if (string.IsNullOrWhiteSpace(rawKey)) return null;
                    if (!keyMap.TryGetValue(rawKey, out var key))
                    {
                        warnings.Add($"Ismeretlen forráskulcs: {rawKey}.");
                        return null;
                    }
                    if (pdfNorm.Length > 0 && !LooksVerbatim(sourceByKey[key], pdfNorm))
                        warnings.Add("A forrásszöveg nem található meg szó szerint a PDF szövegében (a modell módosíthatta).");
                    return key;
                }

                string? taskSource = ResolveSource(t.SourceKey, taskWarnings);

                if (t.Points.HasValue && t.SubQuestions.Count > 0 && t.SubQuestions.All(x => x.Points.HasValue))
                {
                    int subSum = t.SubQuestions.Sum(x => x.Points!.Value);
                    if (subSum != t.Points.Value)
                        taskWarnings.Add($"A részpontok összege ({subSum}) nem egyezik a feladat pontjával ({t.Points}).");
                }

                if (t.Type == "tobb_opcio" && t.Options.Count < 2)
                    taskWarnings.Add("Egy helyes válaszos (tobb_opcio), de kevesebb mint 2 válaszlehetőség van.");

                // Témakör: csak létező azonosítót fogadunk el
                int? topicId = t.TopicId.HasValue && topicIds.Contains(t.TopicId.Value) ? t.TopicId : null;

                // Táblázat -> cellák (1-től számozva)
                var cells = t.Table.Cells
    .Select(c => new DraftCell { Row = c.Row, Column = c.Column, Value = c.Value, Visible = c.Visible })
    .ToList();
                if (t.Uncertain)
                    taskWarnings.Add("A modell bizonytalan: " + (t.Note ?? "nincs indoklás"));

                string stem = t.Stem.Trim();

                // --- Nincs részkérdés: egy feladat = egy sor ---
                if (t.SubQuestions.Count == 0)
                {
                    draft.Tasks.Add(new DraftTask
                    {
                        Number = t.Number,
                        TopicId = topicId,
                        SourceKey = taskSource,
                        Question = stem,
                        Options = t.Options.ToList(),
                        Points = t.Points,
                        TypeName = t.Type,
                        TableColumns = t.Table.Columns.ToList(),
                        TableCells = cells,
                        AnswerLines = t.AnswerLines,
                        HasFigure = t.HasFigure,
                        PageFrom = t.PageFrom,
                        PageTo = t.PageTo,
                        Warnings = taskWarnings,
                        NeedsReview = taskWarnings.Count > 0 || t.HasFigure || cells.Count > 0
                    });
                    continue;
                }

                // --- Van részkérdés: minden részkérdés külön sor, saját vagy a feladat forrásával ---
                bool first = true;
                foreach (var s in t.SubQuestions)
                {
                    var warnings = new List<string>(taskWarnings);

                    string? subSource = string.IsNullOrWhiteSpace(s.SourceKey)
                        ? taskSource
                        : ResolveSource(s.SourceKey, warnings);

                    string label = s.Label.Trim().TrimEnd(')', '.');
                    string question = stem.Length == 0
                        ? s.Text.Trim()
                        : $"{stem}\n\n{label}) {s.Text.Trim()}";

                    draft.Tasks.Add(new DraftTask
                    {
                        Number = t.Number,
                        PartLabel = label,
                        TopicId = topicId,
                        SourceKey = subSource,
                        Question = question,
                        Options = t.Options.ToList(),
                        Points = s.Points,
                        TypeName = t.Type,
                        // a táblázat csak az első részhez kerül, hogy ne duplázódjon
                        TableColumns = first ? t.Table.Columns.ToList() : new List<string>(),
                        TableCells = first ? cells : new List<DraftCell>(),
                        AnswerLines = t.AnswerLines,
                        HasFigure = t.HasFigure,
                        PageFrom = t.PageFrom,
                        PageTo = t.PageTo,
                        Warnings = warnings,
                        NeedsReview = warnings.Count > 0 || t.HasFigure || (first && cells.Count > 0)
                    });
                    first = false;
                }
            }

            return draft;
        }

        private static int? ParseYear(string? date)
        {
            if (string.IsNullOrWhiteSpace(date)) return null;
            var m = Regex.Match(date, @"\b(20\d{2})\b");
            return m.Success ? int.Parse(m.Groups[1].Value) : null;
        }

        private static string DetectPeriod(string? date)
        {
            string d = (date ?? "").ToLowerInvariant();
            if (d.Contains("május")) return "május";
            if (d.Contains("október")) return "október";
            return "";
        }

        // A szint szövegét az adminfelületed szóhasználatához igazítottam.
        // Ellenőrizd, hogy az ev.szint értékei az adatbázisban is így szerepelnek-e.
        private static string NormalizeLevel(string level)
        {
            string l = (level ?? "").ToLowerInvariant();
            if (l.Contains("emelt")) return "Emelt szint";
            if (l.Contains("közép")) return "Középszint";
            return "";
        }

        // Csak betűk és számok, kisbetűvel: a sortörések, kötőjelek, szóközök nem számítanak.
        private static string Norm(string s)
        {
            var sb = new StringBuilder(s.Length);
            foreach (char c in s)
                if (char.IsLetterOrDigit(c)) sb.Append(char.ToLowerInvariant(c));
            return sb.ToString();
        }

        // A forrásból vett 50 karakteres mintákat keresi a PDF szövegében; legalább 80%-nak meg kell lennie.
        private static bool LooksVerbatim(string source, string pdfNorm)
        {
            string n = Norm(source);
            if (n.Length < 80) return true;

            int step = Math.Max(50, n.Length / 6);
            int found = 0, total = 0;
            for (int pos = 0; pos + 50 <= n.Length; pos += step)
            {
                total++;
                if (pdfNorm.Contains(n.Substring(pos, 50))) found++;
            }
            return total == 0 || found * 10 >= total * 8;
        }
    }
}