using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System;
using System.IO;
using UglyToad.PdfPig;

namespace TudasterAdmin.Processing
{
    internal class PdfTextExtractor
    {
        public string ExtractText(string filePath)
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

            var result = new StringBuilder();

            using (var document = PdfDocument.Open(filePath))
            {
                foreach (var page in document.GetPages())
                {
                    result.AppendLine($"--- {page.Number}. oldal ---");
                    result.AppendLine(page.Text);
                    result.AppendLine();
                }
            }

            return result.ToString();
        }
    }
}
