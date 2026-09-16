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

            TaskTextBox.Text = task.Title;
            TopicTextBox.Text = task.Topic;

            foreach (ComboBoxItem item in SubjectComboBox.Items)
            {
                if (item.Content?.ToString() == task.Subject)
                {
                    SubjectComboBox.SelectedItem = item;
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

            string subject =
                subjectItem.Content?.ToString() ?? "";

            // Ha szerkesztünk
            if (_editingTask != null)
            {
                _editingTask.Title = taskText;
                _editingTask.Subject = subject;
                _editingTask.Topic = topic;

                CreatedTask = _editingTask;
            }
            // Ha új feladatot hozunk létre
            else
            {
                CreatedTask = new TaskItem
                {
                    Title = taskText,
                    Subject = subject,
                    Topic = topic,
                    Status = "Ellenőrzésre vár"
                };
            }

            DialogResult = true;
        }
    }
}