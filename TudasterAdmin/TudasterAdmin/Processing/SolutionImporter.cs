using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TudasterAdmin.Processing
{
    internal record SolutionImportResult(int Applied, int WithWarnings, List<string> Unmatched);

    internal static class SolutionImporter
    {
        // only = null: az összes feladat; különben csak az a feladat (egy gombnyomásra)
        public static async Task<SolutionImportResult> ImportAsync(
            GeminiService gemini, DraftExam exam, byte[] keyPdf,
            DraftTask? only = null, bool overwrite = false, CancellationToken ct = default)
        {
            var targets = only != null ? new List<DraftTask> { only } : exam.Tasks.ToList();
            var ai = await gemini.ParseSolutionsAsync(keyPdf, exam, targets, ct);

            // 1) Az útmutató tényleg ehhez a feladatlaphoz tartozik-e
            var mismatch = new List<string>();
            if (ai.Year.HasValue && exam.Year.HasValue && ai.Year != exam.Year)
                mismatch.Add($"év: útmutató {ai.Year}, draft {exam.Year}");
            if (!string.IsNullOrWhiteSpace(ai.Period) && !string.IsNullOrWhiteSpace(exam.Period)
                && Norm(ai.Period) != Norm(exam.Period))
                mismatch.Add($"időszak: útmutató {ai.Period}, draft {exam.Period}");
            if (!string.IsNullOrWhiteSpace(ai.Level) && !string.IsNullOrWhiteSpace(exam.Level)
                && Norm(exam.Level).Substring(0, 3) != Norm(ai.Level).Substring(0, Math.Min(3, Norm(ai.Level).Length)))
                mismatch.Add($"szint: útmutató {ai.Level}, draft {exam.Level}");
            if (!string.IsNullOrWhiteSpace(ai.Subject) && !string.IsNullOrWhiteSpace(exam.Subject)
                && !Norm(exam.Subject).Contains(Norm(ai.Subject)) && !Norm(ai.Subject).Contains(Norm(exam.Subject)))
                mismatch.Add($"tantárgy: útmutató {ai.Subject}, draft {exam.Subject}");

            if (mismatch.Count > 0)
                throw new InvalidOperationException(
                    "Az útmutató nem ehhez a feladatlaphoz tartozik: " + string.Join("; ", mismatch));

            // 2) Párosítás feladat + rész alapján
            int applied = 0, withWarn = 0;
            var unmatched = new List<string>();

            foreach (var s in ai.Solutions)
            {
                string part = (s.Part ?? "").Trim().TrimEnd(')', '.').ToLowerInvariant();
                var candidates = targets.Where(t => t.Number == s.Number).ToList();

                DraftTask? task = candidates.FirstOrDefault(t => (t.PartLabel ?? "").ToLowerInvariant() == part);
                var warnings = new List<string>();

                if (task == null && candidates.Count == 1)
                {
                    task = candidates[0];   // a modell részjelet adott / hagyott el, de csak egy jelölt van
                    warnings.Add("Megoldás: a részjel nem egyezett, a feladatszám alapján párosítva.");
                }
                if (task == null)
                {
                    unmatched.Add($"{s.Number}{(part.Length > 0 ? "." + part : "")}");
                    continue;
                }

                if (!overwrite && (task.CorrectAnswers.Count > 0 || !string.IsNullOrWhiteSpace(task.Solution)))
                    continue;   // már van megoldás, nem írjuk felül

                // 3) Ellenőrzések
                if (!s.Matches)
                    warnings.Add("Megoldás: a modell nem biztos a párosításban" + (s.Note != null ? ": " + s.Note : "."));
                if (s.Points.HasValue && task.Points.HasValue && s.Points != task.Points)
                    warnings.Add($"Megoldás: pontszám eltér (útmutató {s.Points}, draft {task.Points}).");
                warnings.AddRange(ValidateAnswers(task, s.CorrectAnswers));

                task.CorrectAnswers = s.CorrectAnswers.Select(a => a.Trim()).Where(a => a.Length > 0).ToList();
                task.Solution = s.Solution.Trim();
                task.SolutionHint = s.KeyHint.Trim();

                task.Warnings.RemoveAll(w => w.StartsWith("Megoldás:"));
                task.Warnings.AddRange(warnings);
                if (warnings.Count > 0) { task.NeedsReview = true; task.Approved = false; withWarn++; }
                applied++;
            }

            exam.UpdatedUtc = DateTime.UtcNow;
            return new SolutionImportResult(applied, withWarn, unmatched);
        }

        private static List<string> ValidateAnswers(DraftTask t, List<string> answers)
        {
            var w = new List<string>();
            bool choice = t.TypeName is "tobb_opcio" or "tobb_valasz" or "sorba_rendezos";

            if (t.TypeName == "tablazatos_feladat") return w;
            if (answers.Count == 0) { w.Add("Megoldás: nincs helyes válasz megadva."); return w; }

            if (choice)
            {
                foreach (var a in answers)
                {
                    if (!int.TryParse(a.Trim().TrimEnd('.'), out int n) || n < 1 || (t.Options.Count > 0 && n > t.Options.Count))
                        w.Add($"Megoldás: érvénytelen válaszsorszám: \"{a}\" ({t.Options.Count} lehetőség van).");
                }
                if (t.TypeName == "tobb_opcio" && answers.Count != 1)
                    w.Add($"Megoldás: tobb_opcio típusnál 1 helyes válasz kell, itt {answers.Count} van.");
                if (t.TypeName == "sorba_rendezos" && t.Options.Count > 0 && answers.Count != t.Options.Count)
                    w.Add($"Megoldás: a sorrendben {answers.Count} elem van, a feladatban {t.Options.Count}.");
            }
            return w;
        }

        private static string Norm(string s)
        {
            var sb = new StringBuilder();
            foreach (char c in s ?? "")
                if (char.IsLetterOrDigit(c)) sb.Append(char.ToLowerInvariant(c));
            return sb.ToString();
        }
    }
}