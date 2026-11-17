using System;
using System.IO;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Windows;

namespace TudasterAdmin.Processing
{
    internal class JsonToPostgresql
    {
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

            return exam;
        }
    }
}