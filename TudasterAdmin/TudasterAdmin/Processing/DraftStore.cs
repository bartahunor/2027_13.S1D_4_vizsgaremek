using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace TudasterAdmin.Processing
{
    internal record DraftSummary(string Id, string Title, int TaskCount, int ApprovedCount, DateTime UpdatedUtc);

    internal static class DraftStore
    {
        private static readonly JsonSerializerOptions Opts = new()
        {
            WriteIndented = true,
            PropertyNameCaseInsensitive = true,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        public static string RootDir => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "TudasterAdmin", "drafts");

        private static string DraftDir(string id) => Path.Combine(RootDir, id);
        private static string DraftFile(string id) => Path.Combine(DraftDir(id), "draft.json");
        private static string ImagesDir(string id) => Path.Combine(DraftDir(id), "images");

        public static void Save(DraftExam draft)
        {
            draft.UpdatedUtc = DateTime.UtcNow;
            Directory.CreateDirectory(DraftDir(draft.Id));

            // Előbb ideiglenes fájlba írunk, hogy egy hiba ne rongálja meg a meglévő mentést.
            string tmp = DraftFile(draft.Id) + ".tmp";
            File.WriteAllText(tmp, JsonSerializer.Serialize(draft, Opts));
            File.Move(tmp, DraftFile(draft.Id), overwrite: true);
        }

        public static DraftExam? Load(string id)
        {
            string file = DraftFile(id);
            if (!File.Exists(file)) return null;
            return JsonSerializer.Deserialize<DraftExam>(File.ReadAllText(file), Opts);
        }

        public static List<DraftSummary> List()
        {
            var result = new List<DraftSummary>();
            if (!Directory.Exists(RootDir)) return result;

            foreach (string dir in Directory.GetDirectories(RootDir))
            {
                try
                {
                    var d = Load(Path.GetFileName(dir));
                    if (d == null) continue;
                    result.Add(new DraftSummary(
                        d.Id, d.Title, d.Tasks.Count, d.Tasks.Count(t => t.Approved), d.UpdatedUtc));
                }
                catch
                {
                    // sérült piszkozat: kihagyjuk a listából
                }
            }

            return result.OrderByDescending(r => r.UpdatedUtc).ToList();
        }

        public static void Delete(string id)
        {
            string dir = DraftDir(id);
            if (Directory.Exists(dir)) Directory.Delete(dir, true);
        }

        public static void SavePdfCopy(DraftExam draft, string pdfPath)
        {
            Directory.CreateDirectory(DraftDir(draft.Id));
            File.Copy(pdfPath, Path.Combine(DraftDir(draft.Id), "source.pdf"), overwrite: true);
        }

        public static string? ImagePath(DraftExam draft, string? fileName) =>
            string.IsNullOrEmpty(fileName) ? null : Path.Combine(ImagesDir(draft.Id), fileName);

        // Egy forráshoz egy kép tartozik (forrasok.kep egyetlen útvonal).
        public static void SetSourceImage(DraftExam draft, DraftSource source, string sourceFile)
        {
            Directory.CreateDirectory(ImagesDir(draft.Id));
            RemoveSourceImage(draft, source);

            string ext = Path.GetExtension(sourceFile).ToLowerInvariant();
            string name = $"{source.Key}_{Guid.NewGuid().ToString("N").Substring(0, 8)}{ext}";
            File.Copy(sourceFile, Path.Combine(ImagesDir(draft.Id), name), overwrite: true);
            source.ImageFile = name;
        }

        public static void RemoveSourceImage(DraftExam draft, DraftSource source)
        {
            string? path = ImagePath(draft, source.ImageFile);
            if (path != null && File.Exists(path)) File.Delete(path);
            source.ImageFile = null;
        }
    }
}