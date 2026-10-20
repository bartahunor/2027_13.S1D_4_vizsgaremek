using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TudasterAdmin.Processing
{
    internal class ParsedTask
    {
        // a te eredeti mezőid
        public int Number { get; set; }
        public string Title { get; set; } = "";
        public string Text { get; set; } = "";
        public string SourceText { get; set; } = "";
        public List<string> SubQuestions { get; set; } = new();
        public int? Points { get; set; }
        public bool NeedsReview { get; set; }

        // az új mezők
        public string TypeName { get; set; } = "";
        public bool HasTable { get; set; }
        public bool HasFigure { get; set; }
        public int AnswerLines { get; set; }
        public int PageFrom { get; set; }
        public int PageTo { get; set; }
        public int Confidence { get; set; }
        public List<string> Options { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }
}
