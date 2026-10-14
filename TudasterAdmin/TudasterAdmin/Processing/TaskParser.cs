
using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace TudasterAdmin.Processing
{
    internal class TaskParser
    {
        public List<ParsedTask> ParseTasks(string extractedText)
        {
            var tasks = new List<ParsedTask>();

            if (string.IsNullOrWhiteSpace(extractedText))
                return tasks;

            string text = extractedText
                .Replace("\r\n", "\n")
                .Replace('\r', '\n');
            text = Regex.Replace(
                text,
                @"Név:\s*\.{3,}",
                "",
                RegexOptions.IgnoreCase);

            text = Regex.Replace(
                text,
                @"osztály:\s*\.{2,}",
                "",
                RegexOptions.IgnoreCase);

            // Vizsgaazonosító és oldalszámozás eltávolítása.
            text = Regex.Replace(
                text,
                @"\b\d{4}\s+írásbeli vizsga\b",
                "",
                RegexOptions.IgnoreCase);

            text = Regex.Replace(
                text,
                @"\b\d{1,2}\s*/\s*\d{1,2}\b",
                "");

            text = Regex.Replace(
                text,
                @"[ \t]{2,}",
                " ");

            // A PDF-oldaljelöléseket eltávolítjuk a szövegből.
            text = Regex.Replace(
                text,
                @"\[\[PDF_OLDAL_\d+\]\]",
                "\n");

            // A feladat száma után pont vagy zárójel is állhat.
            // A sorszámot a sor elején keressük.
            var pattern = new Regex(
            @"(?<!\S)(\d{1,2})\.\s+(?=[A-ZÁÉÍÓÖŐÚÜŰ])",
            RegexOptions.CultureInvariant);

            System.Windows.MessageBox.Show(
                text.Substring(0, Math.Min(4000, text.Length)),
                "A felismerő tényleges bemenete"
            );

            var matches = pattern.Matches(text);

            for (int i = 0; i < matches.Count; i++)
            {
                Match match = matches[i];

                if (!int.TryParse(match.Groups[1].Value, out int number))
                    continue;

                // A vizsgafeladatok sorszáma általában pozitív.
                if (number < 1 || number > 30)
                    continue;

                int start = match.Index;
                int end = i + 1 < matches.Count
                    ? matches[i + 1].Index
                    : text.Length;

                string taskText = text.Substring(start, end - start).Trim();

                if (taskText.Length < 8)
                    continue;

                // A forrásszöveg bekezdésszámait nem tudjuk
                // minden vizsgatípusnál biztosan megkülönböztetni.
                var subQuestions = new List<string>();
                var subPattern = new Regex(
                    @"(?m)^[ \t]*([a-záéíóöőúüű])[.)][ \t]+\S.+$",
                    RegexOptions.IgnoreCase |
                    RegexOptions.CultureInvariant);

                foreach (Match subMatch in subPattern.Matches(taskText))
                    subQuestions.Add(subMatch.Value.Trim());

                tasks.Add(new ParsedTask
                {
                    Number = number,
                    Title = number + ". feladat",
                    Text = taskText,
                    SourceText = "",
                    SubQuestions = subQuestions,
                    Points = null,
                    NeedsReview = true
                });
            }

            return tasks;
        }
    }
}
