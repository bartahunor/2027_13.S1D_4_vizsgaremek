using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace TudasterAdmin.Processing
{
    internal class AnswerKeyResult
    {
        public int Filled { get; set; }        // hány feladat kapott új adatot
        public int Missing { get; set; }       // hány feladathoz nem találtunk megoldást
        public int WarningCount { get; set; }
    }

    internal static class AnswerKeyMapper
    {
        // Ezzel kezdődnek a megoldókulcsból származó figyelmeztetések (újrafuttatáskor törlődnek).
        public const string Prefix = "Megoldókulcs: ";

        // overwrite = false: csak az üres mezőket tölti ki, a már szerkesztett adatot nem írja felül.
        public static AnswerKeyResult Apply(DraftExam draft, AiAnswerKeyDto key, bool overwrite)
        {
            var result = new AnswerKeyResult();

            draft.Warnings.RemoveAll(w => w.StartsWith(Prefix));
            CheckExam(draft, key);
            result.WarningCount += draft.Warnings.Count(w => w.StartsWith(Prefix));

            foreach (var task in draft.Tasks)
            {
                task.Warnings.RemoveAll(w => w.StartsWith(Prefix));

                var entry = key.Answers.FirstOrDefault(a => a.Number == task.Number);
                if (entry == null)
                {
                    task.Warnings.Add(Prefix + "nincs megoldás a kulcsban ehhez a feladathoz.");
                    result.Missing++;
                    continue;
                }

                var issues = new List<string>();
                bool changed = false;

                // 1) Helyes válaszok
                var incoming = (entry.CorrectAnswers ?? new List<string>())
                    .Select(a => (a ?? "").Trim())
                    .Where(a => a.Length > 0)
                    .ToList();
                var answers = MapToOptions(task, incoming, issues);

                if (answers.Count > 0 && (task.CorrectAnswers.Count == 0 || overwrite))
                {
                    task.CorrectAnswers = answers;
                    changed = true;
                }

                // 2) Megoldás menete, értékelési szempontok
                string solution = (entry.Solution ?? "").Trim();
                if (solution.Length > 0 && (string.IsNullOrWhiteSpace(task.Solution) || overwrite))
                {
                    task.Solution = solution;
                    changed = true;
                }

                // 3) Táblázat: a diák által kitöltendő cellák helyes értéke
                foreach (var ta in entry.TableAnswers ?? new List<AiTableAnswerDto>())
                {
                    var cell = task.TableCells.FirstOrDefault(c => c.Row == ta.Row && c.Column == ta.Column);
                    if (cell == null)
                    {
                        issues.Add($"a(z) {ta.Row}. sor {ta.Column}. oszlopának cellája nem létezik a táblázatban.");
                        continue;
                    }
                    if (cell.Visible) continue;

                    string value = (ta.Value ?? "").Trim();
                    if (value.Length > 0 && (string.IsNullOrWhiteSpace(cell.Value) || overwrite))
                    {
                        cell.Value = value;
                        changed = true;
                    }
                }

                // 4) Pontszám
                if (entry.Points.HasValue)
                {
                    if (!task.Points.HasValue)
                    {
                        task.Points = entry.Points;
                        changed = true;
                    }
                    else if (task.Points != entry.Points)
                    {
                        issues.Add($"a kulcs szerint {entry.Points} pont jár, a feladatnál {task.Points} van.");
                    }
                }

                // 5) Ellenőrzések a végső állapotra
                bool hasAny = HasAnswer(task);
                if (!hasAny)
                {
                    issues.Add("a kulcsban nem találtam használható megoldást ehhez a feladathoz.");
                    result.Missing++;
                }

                int emptyHidden = task.TableCells.Count(c => !c.Visible && string.IsNullOrWhiteSpace(c.Value));
                if (emptyHidden > 0)
                    issues.Add($"{emptyHidden} kitöltendő táblázatcellához nincs helyes érték.");

                int subCount = Regex.Matches(task.Question, @"(?m)^[a-h]\)").Count;
                if (subCount >= 2 && task.CorrectAnswers.Count > 0 && task.CorrectAnswers.Count != subCount)
                    issues.Add($"{subCount} részkérdés van, de {task.CorrectAnswers.Count} válasz szerepel.");

                if (entry.Uncertain)
                    issues.Add("az AI bizonytalan: " +
                               (string.IsNullOrWhiteSpace(entry.Note) ? "nincs indoklás" : entry.Note));

                // Ha a feladat adata megváltozott, újra kell ellenőrizni.
                if (changed)
                {
                    task.Approved = false;
                    result.Filled++;
                }

                foreach (string issue in issues)
                    task.Warnings.Add(Prefix + issue);
                result.WarningCount += issues.Count;
            }

            return result;
        }

        public static bool HasAnswer(DraftTask t) =>
            t.CorrectAnswers.Count > 0
            || !string.IsNullOrWhiteSpace(t.Solution)
            || t.TableCells.Any(c => !c.Visible && !string.IsNullOrWhiteSpace(c.Value));

        // ---------- A vizsga azonosító adatainak összevetése ----------
        private static void CheckExam(DraftExam draft, AiAnswerKeyDto key)
        {
            void Add(string message) => draft.Warnings.Add(Prefix + message);

            if (key.Year.HasValue && draft.Year.HasValue && key.Year != draft.Year)
                Add($"a kulcs éve ({key.Year}) eltér a feladatsorétól ({draft.Year}), lehet, hogy másik vizsgához tartozik.");

            string keyLevel = NormalizeLevel(key.Level);
            if (keyLevel != "" && draft.Level != "" &&
                !string.Equals(keyLevel, draft.Level, StringComparison.OrdinalIgnoreCase))
                Add($"a kulcs szintje ({keyLevel}) eltér a feladatsorétól ({draft.Level}).");

            string keyPeriod = (key.Period ?? "").Trim().ToLowerInvariant();
            if (keyPeriod != "" && draft.Period != "" && keyPeriod != draft.Period.Trim().ToLowerInvariant())
                Add($"a kulcs időszaka ({keyPeriod}) eltér a feladatsorétól ({draft.Period}).");

            string ks = Norm(key.Subject), ds = Norm(draft.Subject);
            if (ks != "" && ds != "" && !ks.Contains(ds) && !ds.Contains(ks))
                Add($"a kulcs tantárgya ({key.Subject}) eltér a feladatsorétól ({draft.Subject}).");

            if (key.TotalPoints.HasValue && draft.TotalPoints.HasValue && key.TotalPoints != draft.TotalPoints)
                Add($"a kulcs összpontszáma ({key.TotalPoints}) eltér a feladatsorétól ({draft.TotalPoints}).");
        }

        // ---------- Feleletválasztós válaszok illesztése a lehetőségekhez ----------
        private static List<string> MapToOptions(DraftTask task, List<string> answers, List<string> issues)
        {
            if (task.Options.Count == 0) return answers;

            var mapped = new List<string>();
            foreach (string answer in answers)
            {
                // Ha a betűjelet adta meg (A, B, C), átváltjuk a lehetőség szövegére.
                var m = Regex.Match(answer, @"^([A-Za-z])\s*[).]?$");
                if (m.Success)
                {
                    int index = char.ToUpperInvariant(m.Groups[1].Value[0]) - 'A';
                    if (index >= 0 && index < task.Options.Count)
                    {
                        mapped.Add(task.Options[index]);
                        continue;
                    }
                }

                mapped.Add(answer);
                if (!task.Options.Any(o => OptionMatches(o, answer)))
                    issues.Add($"a(z) „{Shorten(answer)}” válasz nem szerepel a lehetőségek között.");
            }
            return mapped;
        }

        private static bool OptionMatches(string option, string answer)
        {
            string o = Norm(option), a = Norm(answer);
            if (a.Length == 0) return false;
            if (o == a) return true;
            if (a.Length >= 3 && o.Contains(a)) return true;
            if (o.Length >= 3 && a.Contains(o)) return true;
            return false;
        }

        private static string Shorten(string s, int max = 40) =>
            s.Length <= max ? s : s.Substring(0, max) + "…";

        private static string NormalizeLevel(string? level)
        {
            string l = (level ?? "").ToLowerInvariant();
            if (l.Contains("emelt")) return "Emelt szint";
            if (l.Contains("közép")) return "Középszint";
            return "";
        }

        // Csak betűk és számok, kisbetűvel.
        private static string Norm(string? s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            var sb = new StringBuilder(s.Length);
            foreach (char c in s)
                if (char.IsLetterOrDigit(c)) sb.Append(char.ToLowerInvariant(c));
            return sb.ToString();
        }
    }
}