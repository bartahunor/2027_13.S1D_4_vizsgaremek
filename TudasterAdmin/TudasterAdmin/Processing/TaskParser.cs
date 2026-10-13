using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.RegularExpressions;

namespace TudasterAdmin.Processing
{
    public class ParsedTask
    {
        public int Number { get; set; }

        public string Text { get; set; } = "";
    }
    internal class TaskParser
    {
        public List<ParsedTask> ParseTasks(string extractedText)
        {
            var tasks = new List<ParsedTask>();

            if (string.IsNullOrWhiteSpace(extractedText))
                return tasks;

            // A feladatszámot akkor is keressük,
            // ha a PDF szövegében nem sor elején szerepel.
            var pattern = new Regex(
                @"(?<![\d(])\b(\d{1,2})\.[ \t]+(?=[A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű„""])",
                RegexOptions.CultureInvariant);

            var matches = pattern.Matches(extractedText);

            for (int i = 0; i < matches.Count; i++)
            {
                var currentMatch = matches[i];

                int start = currentMatch.Index;

                int end = i + 1 < matches.Count
                    ? matches[i + 1].Index
                    : extractedText.Length;

                string taskText = extractedText
                    .Substring(start, end - start)
                    .Trim();

                if (string.IsNullOrWhiteSpace(taskText))
                    continue;

                tasks.Add(new ParsedTask
                {
                    Number = int.Parse(
                        currentMatch.Groups[1].Value),
                    Text = taskText
                });
            }

            return tasks;
        }
    }
}
