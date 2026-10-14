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
                    "A kiválasztott PDF-fájl nem található.",
                    filePath);
            }

            if (!string.Equals(
                    Path.GetExtension(filePath),
                    ".pdf",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException(
                    "A kiválasztott fájl nem PDF.",
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
    }
}