using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace TudasterAdmin.Processing
{
    internal record TopicInfo(int Id, string Name, string Subject);

    // Később ezek az értékek az adatbázisból jönnek (feladat_tipusok, ev.szint).
    internal static class DraftDefaults
    {
        public static readonly string[] TaskTypes =
        {
            "feleletvalasztos", "igaz_hamis", "parositas", "tablazatos",
            "esszé", "szamitas", "tobbReszes", "rovid_valasz"
        };

        public static readonly string[] Levels = { "Középszint", "Emelt szint" };
        public static readonly string[] Periods = { "május", "október" };
    }

    // Egy feladatsor (egy PDF) szerkeszthető, még nem feltöltött változata
    internal class DraftExam
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedUtc { get; set; } = DateTime.UtcNow;
        public DateTime? UploadedUtc { get; set; }   // később: mikor került fel az adatbázisba

        public string SourcePdfName { get; set; } = "";
        public string Subject { get; set; } = "";
        public int? Year { get; set; }
        public string Period { get; set; } = "";     // az adatbázisban még nincs ilyen mező
        public string Level { get; set; } = "";
        public int? TotalPoints { get; set; }

        public List<DraftSource> Sources { get; set; } = new();
        public List<DraftTask> Tasks { get; set; } = new();
        public List<string> Warnings { get; set; } = new();

        [JsonIgnore]
        public string Title
        {
            get
            {
                string when = $"{Year} {Period}".Trim();
                string what = string.IsNullOrWhiteSpace(Subject) ? "ismeretlen tantárgy" : Subject;
                string level = string.IsNullOrWhiteSpace(Level) ? "" : $" ({Level})";
                return string.IsNullOrEmpty(when) ? what + level : $"{when} – {what}{level}";
            }
        }
    }

    // forrasok tábla: szöveg + egy kép (a bucket-útvonal a feltöltéskor készül)
    internal class DraftSource
    {
        public string Key { get; set; } = "";
        public string Text { get; set; } = "";
        public string? ImageFile { get; set; }       // fájlnév a draft images mappájában
    }

    internal class DraftCell
    {
        public int Row { get; set; }                 // sor_sorszam (1-től)
        public int Column { get; set; }              // oszlop_sorszam (1-től)
        public string Value { get; set; } = "";      // ertek
        public bool Visible { get; set; } = true;    // lathato
    }

    internal class DraftTask
    {
        public int Number { get; set; }              // sorszám a feladatlapon (az adatbázisban még nincs)

        // --- a feladatok tábla mezői ---
        public int? TopicId { get; set; }            // temakor_id
        public string? SourceKey { get; set; }       // -> forras_id feltöltéskor
        public string Question { get; set; } = "";   // kerdes
        public List<string> Options { get; set; } = new();        // valaszok
        public int? Points { get; set; }             // pont
        public List<string> CorrectAnswers { get; set; } = new(); // helyes_valaszok
        public string TypeName { get; set; } = "";   // tipus_id -> feladat_tipusok.nev
        public string Solution { get; set; } = "";   // megoldás menete (az adatbázisban még nincs)

        // --- táblázatos feladat ---
        public List<string> TableColumns { get; set; } = new();
        public List<DraftCell> TableCells { get; set; } = new();

        // --- szerkesztést segítő mezők (nem kerülnek az adatbázisba) ---
        public int AnswerLines { get; set; }
        public bool HasFigure { get; set; }
        public int PageFrom { get; set; }
        public int PageTo { get; set; }
        public bool NeedsReview { get; set; }
        public bool Approved { get; set; }
        public List<string> Warnings { get; set; } = new();
    }

    // A feltöltéshez kötelező mezők ellenőrzése
    internal static class DraftValidator
    {
        public static List<string> Missing(DraftExam exam, DraftTask t)
        {
            var list = new List<string>();
            if (string.IsNullOrWhiteSpace(t.Question)) list.Add("kérdés");
            if (!t.Points.HasValue) list.Add("pont");
            if (string.IsNullOrWhiteSpace(t.TypeName)) list.Add("típus");
            if (!t.TopicId.HasValue) list.Add("témakör");
            return list;
        }

        public static List<string> MissingForExam(DraftExam exam)
        {
            var list = new List<string>();
            if (string.IsNullOrWhiteSpace(exam.Subject)) list.Add("tantárgy");
            if (!exam.Year.HasValue) list.Add("év");
            if (string.IsNullOrWhiteSpace(exam.Level)) list.Add("szint");
            return list;
        }

        // A későbbi feltöltés gomb csak ekkor lesz aktív.
        public static bool IsReady(DraftExam exam) =>
            exam.UploadedUtc == null
            && MissingForExam(exam).Count == 0
            && exam.Tasks.Count > 0
            && exam.Tasks.All(t => t.Approved && Missing(exam, t).Count == 0);
    }
}