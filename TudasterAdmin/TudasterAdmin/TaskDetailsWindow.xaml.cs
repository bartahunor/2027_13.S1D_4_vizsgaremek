using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using static TudasterAdmin.MainWindow;

namespace TudasterAdmin
{
    public partial class TaskDetailsWindow : Window
    {
        public TaskDetailsWindow(TaskItem task)
        {
            InitializeComponent();

            TitleText.Text = task.Title;
            SubjectText.Text = task.Subject;
            TopicText.Text = task.Topic;
            LevelText.Text = task.Level;
            YearText.Text = task.Year;
            PointsText.Text = task.Points;
            AnswerText.Text = task.Answer;
            ExplanationText.Text = task.Explanation;
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
