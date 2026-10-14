using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TudasterAdmin.Processing
{
    public class ParsedTask
    {
        public int Number { get; set; }

        public string Title { get; set; } = "";

        public string Text { get; set; } = "";

        public string SourceText { get; set; } = "";

        public List<string> SubQuestions { get; set; } = new List<string>();

        public int? Points { get; set; }

        public bool NeedsReview { get; set; }
    }
}
