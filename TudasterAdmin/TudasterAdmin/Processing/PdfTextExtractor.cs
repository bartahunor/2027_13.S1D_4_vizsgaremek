
using System;
using System.Collections.Generic;
using System.IO;
using UglyToad.PdfPig;

namespace TudasterAdmin.Processing
{
    internal class PdfTextExtractor
    {
        public List<PdfPageContent> ExtractPages(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                throw new ArgumentException(
                    "A fájl elérési útja nem lehet üres.",
                    nameof(filePath));
            }

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException(
                    "A kiválasztott fájl nem található.",
                    filePath);
            }

            // A fájl tényleges tartalmának ellenőrzése
            if (!IsPdfFile(filePath))
            {
                throw new ArgumentException(
                    "A kiválasztott fájl tartalma nem érvényes PDF-formátumra utal.",
                    nameof(filePath));
            }

            var pages = new List<PdfPageContent>();

            using (var document = PdfDocument.Open(filePath))
            {
                foreach (var page in document.GetPages())
                {
                    pages.Add(new PdfPageContent
                    {
                        PageNumber = page.Number,
                        Text = page.Text ?? ""
                    });
                }
            }

            return pages;
        }

        internal static bool IsPdfFile(string filePath)
        {
            byte[] buffer = new byte[1024];
            byte[] signature = { 0x25, 0x50, 0x44, 0x46, 0x2D }; // %PDF-

            using (var stream = File.OpenRead(filePath))
            {
                int bytesRead = stream.Read(buffer, 0, buffer.Length);

                for (int i = 0; i <= bytesRead - signature.Length; i++)
                {
                    bool match = true;

                    for (int j = 0; j < signature.Length; j++)
                    {
                        if (buffer[i + j] != signature[j])
                        {
                            match = false;
                            break;
                        }
                    }

                    if (match)
                    {
                        return true;
                    }
                }
            }

            return false;
        }
    }
}
