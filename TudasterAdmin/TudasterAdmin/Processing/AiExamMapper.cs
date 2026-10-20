using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace TudasterAdmin.Processing
{
    internal static class AiExamMapper
    {
        // pdfText: a meglévő kinyerőd szövege (a forrásszövegek ellenőrzéséhez); lehet null.
        public static List<ParsedTask> ToParsedTasks(
            AiExamDto exam, string? pdfText, out List<string> globalWarnings)
        {
            globalWarnings = new List<string>();
            var result = new List<ParsedTask>();

            string pdfNorm = pdfText != null
                ? Norm(Regex.Replace(pdfText, @"\[\[PDF_OLDAL_\d+\]\]", " "))
                : "";

            var sources = exam.Sources
                .GroupBy(s => s.Key)
                .ToDictionary(g => g.Key, g => g.First().Text);

            var ordered = exam.Tasks.OrderBy(t => t.Number).ToList();

            // --- Globális ellenőrzések ---
            for (int i = 0; i < ordered.Count; i++)
            {
                if (ordered[i].Number != i + 1)
                {
                    globalWarnings.Add($"A feladatok sorszáma nem folyamatos (hiány vagy ismétlődés a(z) {i + 1}. helyen).");
                    break;
                }
            }

            if (exam.TotalPoints.HasValue && ordered.All(t => t.Points.HasValue))
            {
                int sum = ordered.Sum(t => t.Points!.Value);
                if (sum != exam.TotalPoints.Value)
                    globalWarnings.Add($"A feladatpontok összege ({sum}) nem egyezik az összpontszámmal ({exam.TotalPoints}).");
            }
            else if (ordered.Any(t => !t.Points.HasValue))
            {
                globalWarnings.Add("Egyes feladatoknál nincs pontszám.");
            }

            // --- Feladatonként ---
            foreach (var t in ordered)
            {
                t.Table ??= new AiTableDto();
                var warnings = new List<string>();

                string source = "";
                if (!string.IsNullOrEmpty(t.SourceKey))
                {
                    if (sources.TryGetValue(t.SourceKey, out var s)) source = s;
                    else warnings.Add($"Ismeretlen forráskulcs: {t.SourceKey}.");
                }

                if (source.Length > 0 && pdfNorm.Length > 0 && !LooksVerbatim(source, pdfNorm))
                    warnings.Add("A forrásszöveg nem található meg szó szerint a PDF szövegében (a modell módosíthatta).");

                var subs = t.SubQuestions
                    .Select(x => $"{x.Label.Trim().TrimEnd(')', '.')}) {x.Text.Trim()}")
                    .ToList();

                if (t.Points.HasValue && t.SubQuestions.Count > 0 && t.SubQuestions.All(x => x.Points.HasValue))
                {
                    int subSum = t.SubQuestions.Sum(x => x.Points!.Value);
                    if (subSum != t.Points.Value)
                        warnings.Add($"A részpontok összege ({subSum}) nem egyezik a feladat pontjával ({t.Points}).");
                }

                if (t.Type == "feleletvalasztos" && t.Options.Count < 2)
                    warnings.Add("Feleletválasztós, de kevesebb mint 2 válaszlehetőség van.");

                bool hasTable = t.Table.Columns.Count > 0;
                string text = t.Stem.Trim();
                if (hasTable) text += "\n\n" + RenderTable(t.Table);

                if (t.Uncertain)
                    warnings.Add("A modell bizonytalan: " + (t.Note ?? "nincs indoklás"));

                int confidence = Math.Max(0, 3 - warnings.Count);

                result.Add(new ParsedTask
                {
                    Number = t.Number,
                    Title = t.Number + ". feladat",
                    Text = text,
                    SourceText = source,
                    SubQuestions = subs,
                    Points = t.Points,
                    TypeName = t.Type,
                    HasTable = hasTable,
                    HasFigure = t.HasFigure,
                    AnswerLines = t.AnswerLines,
                    PageFrom = t.PageFrom,
                    PageTo = t.PageTo,
                    Options = t.Options,
                    Warnings = warnings,
                    Confidence = confidence,
                    // Ábra mindig kézi hozzárendelést igényel.
                    NeedsReview = confidence < 3 || t.HasFigure || hasTable
                });
            }

            return result;
        }

        private static string RenderTable(AiTableDto table)
        {
            var sb = new StringBuilder();
            sb.AppendLine("[TABLAZAT]");
            sb.AppendLine(string.Join(" | ", table.Columns));
            foreach (var row in table.Rows)
                sb.AppendLine(string.Join(" | ", row.Cells));
            sb.Append("[/TABLAZAT]");
            return sb.ToString();
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