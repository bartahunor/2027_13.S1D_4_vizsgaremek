using System.Net.Mail;
using System.Text;
using System.Windows;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using static TudasterAdmin.MainWindow;



namespace TudasterAdmin
{
    public partial class TaskWindow : Window
    {
        public TaskItem? CreatedTask { get; private set; }
        private readonly TaskItem? _editingTask;
        public TaskWindow()
        {
            InitializeComponent();
        }

        public TaskWindow(TaskItem task)
        {
            InitializeComponent();

            _editingTask = task;

            // Szöveges mezők visszatöltése
            TaskTextBox.Text = task.Title;
            TopicTextBox.Text = task.Topic;
            YearTextBox.Text = task.Year;
            PointsTextBox.Text = task.Points;
            AnswerTextBox.Text = task.Answer;
            ExplanationTextBox.Text = task.Explanation;

            // Tantárgy visszatöltése
            foreach (ComboBoxItem item in SubjectComboBox.Items)
            {
                if (item.Content?.ToString() == task.Subject)
                {
                    SubjectComboBox.SelectedItem = item;
                    break;
                }
            }

            // Szint visszatöltése
            foreach (ComboBoxItem item in LevelComboBox.Items)
            {
                if (item.Content?.ToString() == task.Level)
                {
                    LevelComboBox.SelectedItem = item;
                    break;
                }
            }
        }
        

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
        }

        private void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            string taskText = TaskTextBox.Text.Trim();
            string topic = TopicTextBox.Text.Trim();
            string year = YearTextBox.Text.Trim();
            string points = PointsTextBox.Text.Trim();
            string answer = AnswerTextBox.Text.Trim();
            string explanation = ExplanationTextBox.Text.Trim();

            if (string.IsNullOrWhiteSpace(taskText))
            {
                MessageBox.Show(
                    "A feladat szövege nem lehet üres.",
                    "Hiányzó adat",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);

                return;
            }

            if (SubjectComboBox.SelectedItem == null)
            {
                MessageBox.Show(
                    "Válassz tantárgyat.",
                    "Hiányzó adat",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);

                return;
            }

            if (LevelComboBox.SelectedItem == null)
            {
                MessageBox.Show(
                    "Válassz szintet.",
                    "Hiányzó adat",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);

                return;
            }

            ComboBoxItem subjectItem =
                (ComboBoxItem)SubjectComboBox.SelectedItem;

            ComboBoxItem levelItem =
                (ComboBoxItem)LevelComboBox.SelectedItem;

            string subject =
                subjectItem.Content?.ToString() ?? "";

            string level =
                levelItem.Content?.ToString() ?? "";

            // Szerkesztés
            if (_editingTask != null)
            {
                _editingTask.Title = taskText;
                _editingTask.Subject = subject;
                _editingTask.Topic = topic;
                _editingTask.Level = level;
                _editingTask.Year = year;
                _editingTask.Points = points;
                _editingTask.Answer = answer;
                _editingTask.Explanation = explanation;

                CreatedTask = _editingTask;
            }
            // Új feladat
            else
            {
                CreatedTask = new TaskItem
                {
                    Title = taskText,
                    Subject = subject,
                    Topic = topic,
                    Level = level,
                    Year = year,
                    Points = points,
                    Answer = answer,
                    Explanation = explanation,
                    Status = "Ellenőrzésre vár"
                };
            }

            DialogResult = true;
        }
    }
}