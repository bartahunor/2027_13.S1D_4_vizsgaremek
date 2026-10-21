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

            foreach (var s in exam.Sources.GroupBy(x => x.Key).Select(g => g.First()))
                draft.Sources.Add(new DraftSource { Key = s.Key, Text = s.Text });

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
                var warnings = new List<string>();

                // Forrás
                string? sourceKey = string.IsNullOrWhiteSpace(t.SourceKey) ? null : t.SourceKey;
                if (sourceKey != null)
                {
                    if (!sourceByKey.TryGetValue(sourceKey, out var src))
                    {
                        warnings.Add($"Ismeretlen forráskulcs: {sourceKey}.");
                        sourceKey = null;
                    }
                    else if (pdfNorm.Length > 0 && !LooksVerbatim(src, pdfNorm))
                    {
                        warnings.Add("A forrásszöveg nem található meg szó szerint a PDF szövegében (a modell módosíthatta).");
                    }
                }

                // kerdes: bevezető + a), b) részek egy szövegben
                var q = new StringBuilder(t.Stem.Trim());
                foreach (var s in t.SubQuestions)
                {
                    string label = s.Label.Trim().TrimEnd(')', '.');
                    q.Append("\n\n").Append(label).Append(") ").Append(s.Text.Trim());
                }

                if (t.Points.HasValue && t.SubQuestions.Count > 0 && t.SubQuestions.All(x => x.Points.HasValue))
                {
                    int subSum = t.SubQuestions.Sum(x => x.Points!.Value);
                    if (subSum != t.Points.Value)
                        warnings.Add($"A részpontok összege ({subSum}) nem egyezik a feladat pontjával ({t.Points}).");
                }


                if (t.Type == "feleletvalasztos" && t.Options.Count < 2)
                    warnings.Add("Feleletválasztós, de kevesebb mint 2 válaszlehetőség van.");

                // Témakör: csak létező azonosítót fogadunk el
                int? topicId = t.TopicId.HasValue && topicIds.Contains(t.TopicId.Value) ? t.TopicId : null;

                // Táblázat -> oszlopok + cellák (1-től számozva)
                var cells = new List<DraftCell>();
                for (int r = 0; r < t.Table.Rows.Count; r++)
                {
                    var row = t.Table.Rows[r];
                    for (int c = 0; c < row.Cells.Count; c++)
                    {
                        cells.Add(new DraftCell
                        {
                            Row = r + 1,
                            Column = c + 1,
                            Value = row.Cells[c].Value,
                            Visible = row.Cells[c].Visible
                        });
                    }
                }

                if (t.Uncertain)
                    warnings.Add("A modell bizonytalan: " + (t.Note ?? "nincs indoklás"));

                draft.Tasks.Add(new DraftTask
                {
                    Number = t.Number,
                    TopicId = topicId,
                    SourceKey = sourceKey,
                    Question = q.ToString().Trim(),
                    Options = t.Options,
                    Points = t.Points,
                    TypeName = t.Type,
                    TableColumns = t.Table.Columns.ToList(),
                    TableCells = cells,
                    AnswerLines = t.AnswerLines,
                    HasFigure = t.HasFigure,
                    PageFrom = t.PageFrom,
                    PageTo = t.PageTo,
                    Warnings = warnings,
                    NeedsReview = warnings.Count > 0 || t.HasFigure || cells.Count > 0
                });
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