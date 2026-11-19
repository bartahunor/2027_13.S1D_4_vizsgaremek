using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;

namespace TudasterAdmin.Processing
{
    /// <summary>A /sourceupload végpont sikeres válasza: { id, kep }.</summary>
    internal sealed class SourceUploadResponse
    {
        // Az id típusa a táblától függ (szám vagy uuid), ezért object; a ToString() mindkettőre jó.
        public object? Id { get; set; }
        public string? Kep { get; set; }
    }

    /// <summary>Egy forrás feltöltésének eredménye.</summary>
    /// <param name="Key">A forrás kulcsa a JSON-ban (pl. "f1").</param>
    /// <param name="Id">A forrasok tábla új sorának azonosítója, siker esetén.</param>
    /// <param name="Error">Hibaüzenet, hiba esetén.</param>
    internal sealed record SourceUploadResult(string Key, string? Id, string? Error)
    {
        public bool Success => Error == null;
    }

    internal class JsonToPostgresql
    {
        private const long MaxImageBytes = 10 * 1024 * 1024; // a végpont bemeneti limitje

        // Egyetlen, újrahasznosított HttpClient (a képfeltöltés és a tömörítés miatt bőkezű időkorlát)
        private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromMinutes(2) };

        // Hibakereső napló: a JSON mellé írja a feltoltes_debug.log fájlt, és a Visual Studio Output ablakába is megy
        private static string? _logPath;
        private static readonly object LogLock = new();

        /// <summary>A legutóbbi feltöltés naplófájljának útvonala.</summary>
        public static string? LogPath => _logPath;

        private static void Log(string message)
        {
            string line = $"{DateTime.Now:HH:mm:ss.fff}  {message}";
            System.Diagnostics.Debug.WriteLine("[Feltöltés] " + line);

            string? path = _logPath;
            if (path == null) return;
            try
            {
                lock (LogLock)
                    File.AppendAllText(path, line + Environment.NewLine, Encoding.UTF8);
            }
            catch
            {
                // a naplózás hibája nem állíthatja meg a feltöltést
            }
        }

        private static readonly JsonSerializerOptions Opts = new()
        {
            PropertyNameCaseInsensitive = true,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        public static DraftExam Process(string jsonFilePath)
        {
            if (string.IsNullOrWhiteSpace(jsonFilePath))
                throw new ArgumentException("A fájl elérési útja nem lehet üres.", nameof(jsonFilePath));

            if (!File.Exists(jsonFilePath))
                throw new FileNotFoundException("A JSON fájl nem található.", jsonFilePath);

            string jsonText = File.ReadAllText(jsonFilePath, Encoding.UTF8);

            DraftExam? exam;
            try
            {
                exam = JsonSerializer.Deserialize<DraftExam>(jsonText, Opts);
            }
            catch (JsonException ex)
            {
                throw new InvalidDataException($"A fájl nem érvényes piszkozat JSON: {ex.Message}", ex);
            }

            if (exam == null)
                throw new InvalidDataException("A JSON fájl üres, nem olvasható ki belőle piszkozat.");

            MessageBox.Show(
                $"Sikeresen beolvasva a feladatsor:\n\n{exam.Title}\n{exam.Tasks.Count} feladat, {exam.Sources.Count} forrás.",
                "Beolvasás kész",
                MessageBoxButton.OK,
                MessageBoxImage.Information);

            // A beolvasás után azonnal indul a feltöltés a háttérben; a hívó kódnak nem kell tennie semmit
            StartUpload(exam, Path.GetDirectoryName(Path.GetFullPath(jsonFilePath))!);

            return exam;
        }

        /// <summary>A /sourceupload végpont teljes címe (ugyanaz az alap, mint a GetFromBackendAsync-nél).</summary>
        private static string GetSourceUploadUrl() =>
            $"{ApiConfig.BackendApiUrl}/adminroutes/sourceupload";

        /// <summary>A bejelentkezett admin tokenje.</summary>
        private static string GetAccessToken() =>
            SessionStore.AccessToken ?? "";

        /// <summary>
        /// Háttérszálon elindítja a feltöltést, a végén összesítő ablakot mutat.
        /// A felületet nem blokkolja, és minden hibát megjelenít.
        /// </summary>
        private static void StartUpload(DraftExam exam, string jsonDirectory)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    var results = await UploadAllAsync(
                        exam, exam.Subject, jsonDirectory, GetSourceUploadUrl(), GetAccessToken());

                    ShowOnUi(() => ShowUploadSummary(exam, results));
                }
                catch (Exception ex)
                {
                    Log($"HIBA a feltöltés közben: {ex}");
                    ShowOnUi(() => MessageBox.Show(
                        ex.Message + (LogPath != null ? $"\n\nRészletes napló: {LogPath}" : ""),
                        "Hiba a feltöltés közben",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error));
                }
            });
        }

        private static void ShowOnUi(Action action)
        {
            var dispatcher = Application.Current?.Dispatcher;
            if (dispatcher == null || dispatcher.CheckAccess())
                action();
            else
                dispatcher.Invoke(action);
        }

        /// <summary>
        /// "Történelem angol nyelven" -> "tortenelem_angol_nyelven".
        /// Kisbetű, ékezetek nélkül (ő, ű is), szóköz helyett aláhúzás, egyéb jel törölve.
        /// </summary>
        public static string FolderName(string subject)
        {
            if (string.IsNullOrWhiteSpace(subject))
                throw new ArgumentException("A tantárgy neve üres, nem képezhető mappanév.", nameof(subject));

            // FormD: az ékezetes betű alapbetű + kombináló jel lesz (az ő/ű is), a jeleket eldobjuk
            string decomposed = subject.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder(decomposed.Length);
            foreach (char c in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    sb.Append(c);
            }

            string s = Regex.Replace(sb.ToString(), @"\s+", "_");   // szóköz -> _
            s = Regex.Replace(s, @"[^a-z0-9_]", "");                // minden más törlése
            s = Regex.Replace(s, @"_+", "_").Trim('_');             // dupla/szélső _ eltüntetése


            if (s.Length == 0)
                throw new ArgumentException($"A(z) \"{subject}\" tantárgynévből nem képezhető mappanév.", nameof(subject));
            if (s.Length > 100)
                s = s[..100].TrimEnd('_');

            return s;
        }

        /// <summary>
        /// Feltölti a feladatsor összes forrását. Az első hibánál megáll, és addig az eredményeket adja vissza
        /// (a sikeres feltöltések azonosítói így nem vesznek el).
        /// </summary>
        /// <param name="subject">A tantárgy neve (pl. "Irodalom"), ebből lesz a mappa neve.</param>
        /// <param name="jsonDirectory">A JSON fájl mappája; a relatív ImageFile útvonalak ehhez képest értendők.</param>
        /// <param name="endpointUrl">
        /// A /sourceupload végpont teljes címe, pl. "https://valami.hu/api/admin/sourceupload".
        /// </param>
        /// <param name="accessToken">A bejelentkezett admin tokenje; Bearer fejlécként megy.</param>
        public static async Task<List<SourceUploadResult>> UploadAllAsync(
            DraftExam exam,
            string subject,
            string jsonDirectory,
            string endpointUrl,
            string accessToken,
            IProgress<(int Done, int Total)>? progress = null)
        {
            _logPath = Path.Combine(jsonDirectory, "feltoltes_debug.log");
            try { File.WriteAllText(_logPath, "", Encoding.UTF8); } catch { _logPath = null; }

            Log($"=== Feltöltés indul: {exam.Sources.Count} forrás, tantárgy: \"{subject}\", " +
                $"JSON mappa: {jsonDirectory}");
            Log($"Végpont: {(string.IsNullOrWhiteSpace(endpointUrl) ? "HIÁNYZIK" : endpointUrl)}, " +
                $"token: {(string.IsNullOrWhiteSpace(accessToken) ? "HIÁNYZIK" : $"megvan ({accessToken.Length} karakter)")}");

            if (string.IsNullOrWhiteSpace(endpointUrl))
            {
                Log("HIBA: a végpont címe üres.");
                throw new ArgumentException("A végpont címe nem lehet üres.", nameof(endpointUrl));
            }
            if (string.IsNullOrWhiteSpace(accessToken))
            {
                Log("HIBA: hiányzik a bejelentkezési token.");
                throw new ArgumentException("Hiányzik a bejelentkezési token.", nameof(accessToken));
            }

            Func<MultipartFormDataContent, Task<SourceUploadResponse>> send =
                form => PostFormAsync(endpointUrl, accessToken, form);

            string folder;
            try
            {
                folder = FolderName(subject);
            }
            catch (Exception ex)
            {
                Log($"HIBA a mappanév képzésekor: {ex.Message}");
                throw;
            }
            Log($"Mappa a bucketban: {folder}");
            var results = new List<SourceUploadResult>();
            int total = exam.Sources.Count;

            foreach (var source in exam.Sources)
            {
                var result = await UploadOneAsync(
                    source.Key, source.Text, source.ImageFile, folder, jsonDirectory, send);

                results.Add(result);
                Log($"[{result.Key}] {(result.Success ? $"OK, azonosító: {result.Id}" : $"HIBA: {result.Error}")}");
                progress?.Report((results.Count, total));

                if (!result.Success) break;
            }

            Log($"=== Vége: {results.Count}/{total} forrás feldolgozva");
            return results;
        }

        public static async Task<SourceUploadResult> UploadOneAsync(
            string key,
            string text,
            string? imageFile,
            string folder,
            string jsonDirectory,
            Func<MultipartFormDataContent, Task<SourceUploadResponse>> send)
        {
            // Szöveg nélküli forrás is mehet, ha van hozzá kép; a kettő közül legalább az egyik kell
            if (string.IsNullOrWhiteSpace(text) && string.IsNullOrWhiteSpace(imageFile))
                return new SourceUploadResult(key, null, "A forrásnak nincs szövege és képe sem.");

            using var form = new MultipartFormDataContent();
            form.Add(new StringContent(text ?? "", Encoding.UTF8), "szoveg");

            FileStream? stream = null;
            try
            {
                if (!string.IsNullOrWhiteSpace(imageFile))
                {
                    string path = Path.IsPathRooted(imageFile)
                        ? imageFile
                        : Path.Combine(jsonDirectory, "images", imageFile);

                    Log($"[{key}] képfájl: \"{imageFile}\" -> {path} (létezik: {File.Exists(path)})");

                    if (!File.Exists(path))
                        return new SourceUploadResult(key, null, $"A képfájl nem található: {path}");

                    if (new FileInfo(path).Length > MaxImageBytes)
                        return new SourceUploadResult(key, null, "A képfájl nagyobb 10 MB-nál.");

                    form.Add(new StringContent(folder, Encoding.UTF8), "mappa");

                    stream = File.OpenRead(path);
                    var fileContent = new StreamContent(stream);
                    fileContent.Headers.ContentType = new MediaTypeHeaderValue(GuessContentType(path));
                    form.Add(fileContent, "kep", Path.GetFileName(path));
                }

                Log($"[{key}] küldés a szervernek (szöveg: {text?.Length ?? 0} karakter, kép: {(stream != null ? "igen" : "nincs")})");
                var response = await send(form);
                string? id = response?.Id?.ToString();

                return string.IsNullOrEmpty(id)
                    ? new SourceUploadResult(key, null, "A válasz nem tartalmaz azonosítót.")
                    : new SourceUploadResult(key, id, null);
            }
            catch (Exception ex)
            {
                Log($"[{key}] KIVÉTEL: {ex}");
                return new SourceUploadResult(key, null, ex.Message);
            }
            finally
            {
                stream?.Dispose();
            }
        }

        /// <summary>
        /// POST kérés a végpontra (multipart/form-data, Bearer token). Hiba esetén kivételt dob,
        /// az üzenetben a HTTP kóddal és a szerver "error" mezőjével.
        /// </summary>
        private static async Task<SourceUploadResponse> PostFormAsync(
            string url, string accessToken, MultipartFormDataContent form)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = form };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            Log($"POST {url}");
            using var response = await Http.SendAsync(request);
            string body = await response.Content.ReadAsStringAsync();
            Log($"Válasz: HTTP {(int)response.StatusCode}, törzs: {(body.Length > 500 ? body[..500] + "…" : body)}");

            if (!response.IsSuccessStatusCode)
            {
                string detail = ReadServerError(body)
                    ?? (body.Length > 300 ? body[..300] + "…" : body);
                throw new HttpRequestException($"A szerver hibát adott (HTTP {(int)response.StatusCode}): {detail}");
            }

            try
            {
                return JsonSerializer.Deserialize<SourceUploadResponse>(body, Opts)
                    ?? throw new InvalidDataException("A szerver válasza üres.");
            }
            catch (JsonException ex)
            {
                throw new InvalidDataException($"A szerver válasza nem értelmezhető: {ex.Message}", ex);
            }
        }

        /// <summary>A szerver { "error": "..." } válaszából kiolvassa az üzenetet, ha van.</summary>
        private static string? ReadServerError(string body)
        {
            try
            {
                using var doc = JsonDocument.Parse(body);
                return doc.RootElement.ValueKind == JsonValueKind.Object
                       && doc.RootElement.TryGetProperty("error", out var e)
                       && e.ValueKind == JsonValueKind.String
                    ? e.GetString()
                    : null;
            }
            catch (JsonException)
            {
                return null;
            }
        }

        /// <summary>
        /// Összesítő ablak a feltöltés végén: forrásonként az azonosító vagy a hiba.
        /// </summary>
        public static void ShowUploadSummary(DraftExam exam, List<SourceUploadResult> results)
        {
            var sb = new StringBuilder();
            bool anyError = false;

            foreach (var r in results)
            {
                if (r.Success)
                {
                    sb.AppendLine($"{r.Key}: feltöltve (azonosító: {r.Id})");
                }
                else
                {
                    anyError = true;
                    sb.AppendLine($"{r.Key}: HIBA – {r.Error}");
                }
            }

            int notTried = exam.Sources.Count - results.Count;
            if (notTried > 0)
                sb.AppendLine($"\nA feltöltés megállt, {notTried} forrás nem lett feltöltve.");

            if (LogPath != null)
                sb.AppendLine($"\nRészletes napló: {LogPath}");

            MessageBox.Show(
                sb.ToString(),
                anyError ? "Feltöltési hiba" : "Feltöltés kész",
                MessageBoxButton.OK,
                anyError ? MessageBoxImage.Warning : MessageBoxImage.Information);
        }

        private static string GuessContentType(string path) =>
            Path.GetExtension(path).ToLowerInvariant() switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".tif" or ".tiff" => "image/tiff",
                _ => "application/octet-stream"
            };
    }
}