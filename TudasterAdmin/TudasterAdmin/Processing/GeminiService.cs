using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;

namespace TudasterAdmin.Processing
{
    // ---------- A modell által visszaadott szerkezet ----------
    internal class AiExamDto
    {
        public string Subject { get; set; } = "";
        public string Level { get; set; } = "";
        public string? Date { get; set; }
        public int? Year { get; set; }
        public string? Period { get; set; }
        public int? TotalPoints { get; set; }
        public List<AiSourceDto> Sources { get; set; } = new();
        public List<AiTaskDto> Tasks { get; set; } = new();
    }
    internal class AiSolutionExamDto
    {
        public string Subject { get; set; } = "";
        public string Level { get; set; } = "";
        public int? Year { get; set; }
        public string? Period { get; set; }
        public List<AiSolutionDto> Solutions { get; set; } = new();
    }

    internal class AiSolutionDto
    {
        public int Number { get; set; }
        public string? Part { get; set; }
        public List<string> CorrectAnswers { get; set; } = new();
        public string Solution { get; set; } = "";
        public int? Points { get; set; }
        public string KeyHint { get; set; } = "";
        public bool Matches { get; set; } = true;
        public string? Note { get; set; }
    }

    internal class AiSourceDto
    {
        public string Key { get; set; } = "";
        public string Text { get; set; } = "";
    }

    internal class AiSubDto
    {
        public string Label { get; set; } = "";
        public string Text { get; set; } = "";
        public int? Points { get; set; }
        public string? SourceKey { get; set; }
    }

    internal class AiCellDto
    {
        public int Row { get; set; }
        public int Column { get; set; }
        public string Value { get; set; } = "";
        public bool Visible { get; set; } = true;
    }

    internal class AiTableDto
    {
        public List<string> Columns { get; set; } = new();
        public List<AiCellDto> Cells { get; set; } = new();
    }

    internal class AiRowDto
    {
        public List<AiCellDto> Cells { get; set; } = new();
    }

    

    internal class AiTaskDto
    {
        public int Number { get; set; }
        public string Type { get; set; } = "";
        public int? Points { get; set; }
        public int? TopicId { get; set; }
        public string Stem { get; set; } = "";
        public string? SourceKey { get; set; }
        public List<AiSubDto> SubQuestions { get; set; } = new();
        public List<string> Options { get; set; } = new();
        public AiTableDto Table { get; set; } = new();
        public int AnswerLines { get; set; }
        public bool HasFigure { get; set; }
        public int PageFrom { get; set; }
        public int PageTo { get; set; }
        public bool Uncertain { get; set; }
        public string? Note { get; set; }
    }

    // ---------- Gemini hívás ----------
    internal class GeminiService
    {
        private static readonly HttpClient Http = new() { Timeout = Timeout.InfiniteTimeSpan };

        private static readonly JsonSerializerOptions ReadOpts = new() { PropertyNameCaseInsensitive = true };
        private static readonly JsonSerializerOptions WriteOpts = new()
        {
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        private readonly string _apiKey;
        private readonly string _model;

        public GeminiService()
        {
            var config = new ConfigurationBuilder()
                .AddUserSecrets<GeminiService>()
                .AddEnvironmentVariables()
                .Build();

            _apiKey = config["Gemini:ApiKey"] ?? config["GEMINI_API_KEY"] ?? "";
            if (string.IsNullOrWhiteSpace(_apiKey))
                throw new InvalidOperationException(
                    "Nem találom az API-kulcsot. A user secretsben a kulcs neve: Gemini:ApiKey");

            _model = config["Gemini:Model"] ?? config["GEMINI_MODEL"] ?? "gemini-3.8-flash";
        }

        private const string BasePrompt = """
            Ez egy magyar érettségi írásbeli feladatlap PDF-je. Add vissza a feladatait a megadott JSON-szerkezetben.

            Szabályok:
            - Hagyd ki a címoldalt, a tudnivalók oldalait, az üres oldalakat, a fejléceket és lábléceket, az oldalszámokat, az értékelő tanár által kitöltendő pontozó táblázatot, valamint a hosszú kifejtős feladatokat és a hozzájuk tartozó sok csikos írásvonalakat.
            - A feladatok és a forrásszövegek szövegét SZÓ SZERINT másold át. Ne javítsd, ne rövidítsd, ne fordítsd, ne foglald össze.
            - Minden feladat a saját sorszámát kapja (number). A forrásszövegben, idézetben vagy felsorolásban szereplő számok NEM új feladatok.
            - A forrásszövegeket a sources tömbbe tedd ("f1", "f2", ... kulccsal), a feladat sourceKey mezője hivatkozzon rá. Ha több feladat ugyanazt a forrást használja, ugyanazt a kulcsot kapják. Ha nincs forrás, sourceKey null.
            - A bevezető szöveg és az utasítás a stem. Az a), b), c) részkérdések a subQuestions tömbbe kerülnek (label: "a", "b", ...), részpontszámmal, ha az látszik.
            - A feleletválasztós (A, B, C, D) lehetőségek az options tömbbe kerülnek, a stem-be nem.
            - Ha egy feladat részkérdései különböző forrásra hivatkoznak (pl. a) az A) betűjelű, b) a B) betűjelű forrásra), minden részkérdés kapja a saját sourceKey-ét. Ha a részkérdésnek nincs saját forrása, a sourceKey null, és a feladat sourceKey-ét használjuk.
            - Táblázat esetén töltsd ki a table.columns és table.cells mezőt. Minden cella {row, column, value, visible}, a row és column 1-től számoz. Az előre megadott cellák visible=true. Ha a táblázatot a diáknak kell kitöltenie, és a cella üres vagy pontozott, akkor visible=false és value üres. Ha nincs táblázat, mindkettő üres tömb.
            - A pontozott vagy üres válaszsorokat ne másold át, csak számold meg őket (answerLines).
            - A matematikai képleteket LaTeX formában írd, $...$ jelek között.
            - points: a feladat mellett szereplő pontszám egész számként; ha nincs megadva, null.
            - Ha a feladathoz ábra, kép, térkép vagy diagram tartozik, hasFigure legyen true. A kép tartalmát NE találd ki.
            - pageFrom / pageTo: a feladat oldalszáma a PDF-ben (1-től számolva).
            - Ha egy feladatnál bizonytalan vagy, uncertain legyen true, és írd a note mezőbe, miért.
            - subject, level ("közép" vagy "emelt"), year (a vizsga éve egész számként), period ("május" vagy "október"), date és totalPoints (a teljes feladatlap összpontszáma) a címoldalról.
            - Ne találj ki semmit, ami nincs a dokumentumban.
            """;

        private static string BuildPrompt(IReadOnlyList<TopicInfo> topics)
        {
            var sb = new StringBuilder(BasePrompt);
            sb.AppendLine().AppendLine();

            if (topics.Count > 0)
            {
                sb.AppendLine("Témakörök (azonosító | tantárgy | név):");
                foreach (var t in topics)
                    sb.AppendLine($"{t.Id} | {t.Subject} | {t.Name}");
                sb.AppendLine(
                    "A topicId mezőben a feladathoz leginkább illő témakör azonosítóját add meg, " +
                    "kizárólag a fenti listából, a vizsga tantárgyához tartozók közül. " +
                    "Ha egyik sem illik egyértelműen, topicId legyen null.");
            }
            else
            {
                sb.AppendLine("A topicId mindig null.");
            }

            return sb.ToString();
        }

        private static string BuildSolutionPrompt(DraftExam exam, IReadOnlyList<DraftTask> tasks)
        {
            var sb = new StringBuilder("""
        Ez egy magyar érettségi javítási-értékelési útmutató PDF-je. Add vissza a megoldásokat a megadott JSON-szerkezetben.

        Szabályok:
        - A címoldalról töltsd ki a subject, level ("közép" vagy "emelt"), year, period ("május" vagy "október") mezőket.
        - Csak az alább felsorolt feladatokhoz adj megoldást, a felsorolás sorszámai (number, part) szerint. Mást ne adj vissza.
        - Ne találj ki semmit. Ha egy feladat megoldása nincs az útmutatóban, hagyd ki.
        - correctAnswers: feleletválasztós (tobb_opcio, tobb_valasz) és sorba_rendezos típusnál a válaszlehetőségek 1-től számozott sorszámai szövegként (pl. A→"1", B→"2", C→"3"; sorba rendezésnél a helyes sorrendben). rovid_valasz típusnál az elfogadott válasz; ha több változat is elfogadott, ugyanabban az elemben, "/" jellel elválasztva. tablazatos_feladat típusnál üres tömb.
        - solution: a megoldás menete / a javítási útmutató szövege az adott feladatra szó szerint, tömören. Ha nincs külön magyarázat, üres.
        - points: az útmutatóban a feladatra adható pontszám egész számként, ha látszik.
        - keyHint: az útmutatóban a feladatot azonosító szöveg szó szerint, legfeljebb 80 karakter (pl. a feladat címe vagy a kérdés eleje).
        - matches: false, ha nem vagy nem biztos, hogy az útmutatóbeli feladat az alábbi feladatnak felel meg; a note mezőben indokold.

        Feladatok (sorszám | rész | típus | pont | válaszlehetőségek száma | a kérdés eleje):
        """);
            sb.AppendLine().AppendLine();

            foreach (var t in tasks)
            {
                string q = t.Question.Replace("\n", " ").Trim();
                if (q.Length > 150) q = q.Substring(0, 150);
                sb.AppendLine($"{t.Number} | {t.PartLabel ?? "-"} | {t.TypeName} | {(t.Points?.ToString() ?? "?")} | {t.Options.Count} | {q}");
            }
            return sb.ToString();
        }

        private static object BuildSolutionSchema()
        {
            var sol = Obj(new Dictionary<string, object>
            {
                ["number"] = Int(),
                ["part"] = Str(true),
                ["correctAnswers"] = Arr(Str()),
                ["solution"] = Str(),
                ["points"] = Int(true),
                ["keyHint"] = Str(),
                ["matches"] = Bool(),
                ["note"] = Str(true)
            }, "number", "correctAnswers", "solution", "keyHint", "matches");

            return Obj(new Dictionary<string, object>
            {
                ["subject"] = Str(),
                ["level"] = Str(),
                ["year"] = Int(true),
                ["period"] = Str(true),
                ["solutions"] = Arr(sol)
            }, "subject", "level", "solutions");
        }

        public Task<AiExamDto> ParseExamAsync(
     byte[] pdfBytes, IReadOnlyList<TopicInfo> topics, CancellationToken ct = default)
     => SendAsync<AiExamDto>(BuildPrompt(topics), pdfBytes, BuildSchema(), ct);

        public Task<AiSolutionExamDto> ParseSolutionsAsync(
            byte[] keyPdf, DraftExam exam, IReadOnlyList<DraftTask> tasks, CancellationToken ct = default)
            => SendAsync<AiSolutionExamDto>(BuildSolutionPrompt(exam, tasks), keyPdf, BuildSolutionSchema(), ct);

        private async Task<T> SendAsync<T>(string prompt, byte[] pdfBytes, object schema, CancellationToken ct)
        {
            string url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:streamGenerateContent?alt=sse";

            var body = new
            {
                contents = new[]
                {
            new
            {
                parts = new object[]
                {
                    new { text = prompt },
                    new { inlineData = new { mimeType = "application/pdf", data = Convert.ToBase64String(pdfBytes) } }
                }
            }
        },
                generationConfig = new
                {
                    responseMimeType = "application/json",
                    responseSchema = schema,
                    maxOutputTokens = 30000,
                    thinkingConfig = new { thinkingLevel = "low" }
                }
            };

            string json = JsonSerializer.Serialize(body, WriteOpts);

            for (int attempt = 0; ; attempt++)
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                cts.CancelAfter(TimeSpan.FromMinutes(10));
                var sw = System.Diagnostics.Stopwatch.StartNew();

                try
                {
                    using var req = new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = new StringContent(json, Encoding.UTF8, "application/json")
                    };
                    req.Headers.Add("x-goog-api-key", _apiKey);

                    using var resp = await Http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, cts.Token);

                    if (resp.IsSuccessStatusCode)
                        return await ReadStreamAsync<T>(resp, sw, cts.Token);

                    string payload = await resp.Content.ReadAsStringAsync(cts.Token);
                    bool retryable = resp.StatusCode == (HttpStatusCode)429 || (int)resp.StatusCode >= 500;
                    Console.WriteLine($"Gemini HTTP {(int)resp.StatusCode} ({sw.Elapsed.TotalSeconds:F0} mp), próba: {attempt + 1}");

                    if (!retryable || attempt >= 3)
                    {
                        string shortPayload = payload.Length > 600 ? payload.Substring(0, 600) : payload;
                        throw new InvalidOperationException($"Gemini hiba ({(int)resp.StatusCode}): {shortPayload}");
                    }
                }
                catch (OperationCanceledException) when (!ct.IsCancellationRequested)
                {
                    if (attempt >= 1)
                        throw new TimeoutException("A Gemini 10 percen belül sem fejezte be a választ.");
                    Console.WriteLine("Időtúllépés, újrapróbálom...");
                    continue;
                }
                catch (RetryableAiException ex)
                {
                    Console.WriteLine($"{ex.Message} Újrapróbálom... (próba: {attempt + 1})");
                    if (attempt >= 2) throw new InvalidOperationException(ex.Message);
                    continue;
                }

                await Task.Delay(TimeSpan.FromSeconds(5 * Math.Pow(3, attempt)), ct);
            }
        }

        private static async Task<T> ReadStreamAsync<T>(
            HttpResponseMessage resp, System.Diagnostics.Stopwatch sw, CancellationToken ct)
        {
            using var stream = await resp.Content.ReadAsStreamAsync(ct);
            using var reader = new StreamReader(stream, Encoding.UTF8);

            var text = new StringBuilder();
            string? finish = null;
            string? block = null;
            int lastReport = 0;

            string? line;
            while ((line = await reader.ReadLineAsync(ct)) != null)
            {
                if (!line.StartsWith("data:")) continue;

                var chunk = JsonNode.Parse(line.Substring(5).Trim());
                block ??= chunk?["promptFeedback"]?["blockReason"]?.GetValue<string>();

                var cand = chunk?["candidates"]?[0];
                finish = cand?["finishReason"]?.GetValue<string>() ?? finish;

                var parts = cand?["content"]?["parts"]?.AsArray();
                if (parts == null) continue;

                foreach (var part in parts)
                {
                    if (part?["thought"]?.GetValue<bool>() == true) continue;
                    string? t = part?["text"]?.GetValue<string>();
                    if (t != null) text.Append(t);
                }

                if (text.Length - lastReport >= 2000)
                {
                    lastReport = text.Length;
                    Console.WriteLine($"  ... {text.Length} karakter, {sw.Elapsed.TotalSeconds:F0} mp");
                }
            }

            Console.WriteLine($"Kész: {text.Length} karakter, {sw.Elapsed.TotalSeconds:F0} mp, finishReason: {finish}");
            return ParseResult<T>(text.ToString(), finish, block);
        }

        private static T ParseResult<T>(string text, string? finish, string? block)
        {
            if (finish == "MAX_TOKENS")
                throw new InvalidOperationException(
                    "A válasz levágódott (túl hosszú a feladatlap egy kéréshez). Küldd két részletben.");

            if (text.Length == 0)
                throw new InvalidOperationException(
                    "A modell nem adott vissza szöveget." + (block != null ? $" Tiltás oka: {block}." : $" finishReason: {finish}."));

            try { File.WriteAllText(Path.Combine(Path.GetTempPath(), "gemini_last.json"), text); } catch { }

            if (finish == "RECITATION" || finish == "SAFETY")
                throw new InvalidOperationException(
                    $"A modell leállt ({finish}). Valószínűleg a szó szerint másolt szöveg miatt.");

            if (finish != "STOP")
                throw new RetryableAiException($"A válasz félbeszakadt (finishReason: {finish ?? "nincs"}).");

            try
            {
                var dto = JsonSerializer.Deserialize<T>(text, ReadOpts);
                return dto ?? throw new RetryableAiException("A válasz nem értelmezhető JSON.");
            }
            catch (JsonException ex)
            {
                string tail = text.Length > 200 ? text.Substring(text.Length - 200) : text;
                throw new RetryableAiException($"Hibás JSON: {ex.Message} | A válasz vége: {tail}");
            }
        }
        internal class RetryableAiException : Exception
        {
            public RetryableAiException(string message) : base(message) { }
        }

        // ---------- A kért JSON-séma ----------
        private static object Str(bool nullable = false) => new { type = "STRING", nullable };
        private static object Int(bool nullable = false) => new { type = "INTEGER", nullable };
        private static object Bool() => new { type = "BOOLEAN" };
        private static object Arr(object items) => new { type = "ARRAY", items };
        private static object EnumStr(params string[] values) => new { type = "STRING", @enum = values };
        private static object Obj(Dictionary<string, object> props, params string[] required) =>
            new { type = "OBJECT", properties = props, required };

        private static object BuildSchema()
        {
            var sub = Obj(new Dictionary<string, object>
            {
                ["label"] = Str(),
                ["text"] = Str(),
                ["points"] = Int(true),
                ["sourceKey"] = Str(true)
            }, "label", "text");

            var cell = Obj(new Dictionary<string, object>
            {
                ["row"] = Int(),
                ["column"] = Int(),
                ["value"] = Str(),
                ["visible"] = Bool()
            }, "row", "column", "value", "visible");

            var table = Obj(new Dictionary<string, object>
            {
                ["columns"] = Arr(Str()),
                ["cells"] = Arr(cell)
            }, "columns", "cells");

            // A típusneveket igazítsd a feladat_tipusok tábla soraihoz.
            var task = Obj(new Dictionary<string, object>
            {
                ["number"] = Int(),
                ["type"] = EnumStr("tobb_opcio", "rovid_valasz", "tablazatos_feladat", "tobb_valasz", "sorba_rendezos"),
                ["points"] = Int(true),
                ["topicId"] = Int(true),
                ["stem"] = Str(),
                ["sourceKey"] = Str(true),
                ["subQuestions"] = Arr(sub),
                ["options"] = Arr(Str()),
                ["table"] = table,
                ["answerLines"] = Int(),
                ["hasFigure"] = Bool(),
                ["pageFrom"] = Int(),
                ["pageTo"] = Int(),
                ["uncertain"] = Bool(),
                ["note"] = Str(true)
            }, "number", "type", "stem", "subQuestions", "options", "table",
               "answerLines", "hasFigure", "pageFrom", "pageTo", "uncertain");

            var source = Obj(new Dictionary<string, object>
            {
                ["key"] = Str(),
                ["text"] = Str()
            }, "key", "text");

            return Obj(new Dictionary<string, object>
            {
                ["subject"] = Str(),
                ["level"] = Str(),
                ["date"] = Str(true),
                ["year"] = Int(true),
                ["period"] = Str(true),
                ["totalPoints"] = Int(true),
                ["sources"] = Arr(source),
                ["tasks"] = Arr(task)
            }, "subject", "level", "sources", "tasks");
        }
    }
}