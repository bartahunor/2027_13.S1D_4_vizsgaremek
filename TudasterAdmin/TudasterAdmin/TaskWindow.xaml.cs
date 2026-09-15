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

        public TaskWindow()
        {
            InitializeComponent();
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

            CreatedTask = new TaskItem
            {
                Title = taskText,
                Subject = subjectItem.Content.ToString() ?? "",
                Topic = topic,
                Status = "Ellenőrzésre vár"
            };

            DialogResult = true;
        }
    }
}