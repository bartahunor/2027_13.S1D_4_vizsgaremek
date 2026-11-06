using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

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
    }

    internal class AiCellDto
    {
        public string Value { get; set; } = "";
        public bool Visible { get; set; } = true;
    }

    internal class AiRowDto
    {
        public List<AiCellDto> Cells { get; set; } = new();
    }

    internal class AiTableDto
    {
        public List<string> Columns { get; set; } = new();
        public List<AiRowDto> Rows { get; set; } = new();
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
        private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromMinutes(5) };

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
            - Hagyd ki a címoldalt, a tudnivalók oldalait, az üres oldalakat, a fejléceket és lábléceket, az oldalszámokat, valamint az értékelő tanár által kitöltendő pontozó táblázatot.
            - A feladatok és a forrásszövegek szövegét SZÓ SZERINT másold át. Ne javítsd, ne rövidítsd, ne fordítsd, ne foglald össze.
            - Minden feladat a saját sorszámát kapja (number). A forrásszövegben, idézetben vagy felsorolásban szereplő számok NEM új feladatok.
            - A forrásszövegeket a sources tömbbe tedd ("f1", "f2", ... kulccsal), a feladat sourceKey mezője hivatkozzon rá. Ha több feladat ugyanazt a forrást használja, ugyanazt a kulcsot kapják. Ha nincs forrás, sourceKey null.
            - A bevezető szöveg és az utasítás a stem. Az a), b), c) részkérdések a subQuestions tömbbe kerülnek (label: "a", "b", ...), részpontszámmal, ha az látszik.
            - A feleletválasztós (A, B, C, D) lehetőségek az options tömbbe kerülnek, a stem-be nem.
            - Táblázat esetén töltsd ki a table.columns és table.rows mezőt. Minden cella {value, visible}. Az előre megadott cellák visible=true. Ha a táblázatot a diáknak kell kitöltenie, és a cella üres vagy pontozott, akkor visible=false és value üres. Ha nincs táblázat, mindkettő üres tömb.
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

        public async Task<AiExamDto> ParseExamAsync(
            byte[] pdfBytes, IReadOnlyList<TopicInfo> topics, CancellationToken ct = default)
        {
            string url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent";

            var body = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new object[]
                        {
                            new { text = BuildPrompt(topics) },
                            new { inlineData = new { mimeType = "application/pdf", data = Convert.ToBase64String(pdfBytes) } }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0,
                    responseMimeType = "application/json",
                    responseSchema = BuildSchema(),
                    maxOutputTokens = 30000
                }
            };

            string json = JsonSerializer.Serialize(body, WriteOpts);

            for (int attempt = 0; ; attempt++)
            {
                using var req = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };
                req.Headers.Add("x-goog-api-key", _apiKey);

                using var resp = await Http.SendAsync(req, ct);
                string payload = await resp.Content.ReadAsStringAsync(ct);

                if (resp.IsSuccessStatusCode)
                    return ParseResponse(payload);

                bool retryable = resp.StatusCode == (HttpStatusCode)429 || (int)resp.StatusCode >= 500;
                if (!retryable || attempt >= 3)
                {
                    string shortPayload = payload.Length > 600 ? payload.Substring(0, 600) : payload;
                    throw new InvalidOperationException($"Gemini hiba ({(int)resp.StatusCode}): {shortPayload}");
                }

                await Task.Delay(TimeSpan.FromSeconds(5 * Math.Pow(3, attempt)), ct);
            }
        }

        private static AiExamDto ParseResponse(string payload)
        {
            var root = JsonNode.Parse(payload);
            var cand = root?["candidates"]?[0];
            string? finish = cand?["finishReason"]?.GetValue<string>();

            var sb = new StringBuilder();
            var parts = cand?["content"]?["parts"]?.AsArray();
            if (parts != null)
            {
                foreach (var part in parts)
                {
                    string? t = part?["text"]?.GetValue<string>();
                    if (t != null) sb.Append(t);
                }
            }

            if (sb.Length == 0)
            {
                string? block = root?["promptFeedback"]?["blockReason"]?.GetValue<string>();
                throw new InvalidOperationException(
                    "A modell nem adott vissza szöveget." + (block != null ? $" Tiltás oka: {block}." : $" finishReason: {finish}."));
            }

            if (finish == "MAX_TOKENS")
                throw new InvalidOperationException(
                    "A válasz levágódott (túl hosszú a feladatlap egy kéréshez). Küldd két részletben.");

            var dto = JsonSerializer.Deserialize<AiExamDto>(sb.ToString(), ReadOpts);
            return dto ?? throw new InvalidOperationException("A válasz nem értelmezhető JSON.");
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
                ["points"] = Int(true)
            }, "label", "text");

            var cell = Obj(new Dictionary<string, object>
            {
                ["value"] = Str(),
                ["visible"] = Bool()
            }, "value", "visible");

            var table = Obj(new Dictionary<string, object>
            {
                ["columns"] = Arr(Str()),
                ["rows"] = Arr(Obj(new Dictionary<string, object> { ["cells"] = Arr(cell) }, "cells"))
            }, "columns", "rows");

            // A típusneveket igazítsd a feladat_tipusok tábla soraihoz.
            var task = Obj(new Dictionary<string, object>
            {
                ["number"] = Int(),
                ["type"] = EnumStr("feleletvalasztos", "igaz_hamis", "parositas", "tablazatos",
                                   "esszé", "szamitas", "tobbReszes", "rovid_valasz"),
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