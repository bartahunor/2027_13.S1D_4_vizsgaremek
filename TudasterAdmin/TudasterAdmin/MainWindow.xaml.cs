using System.Collections.ObjectModel;
using System.Text;
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
using System.Linq;



namespace TudasterAdmin
{
    
    public partial class MainWindow : Window
    {

        private readonly ObservableCollection<TaskItem> _tasks = new();
        private int _nextTaskId = 5;
        private DataGrid? _taskGrid;
        public MainWindow()
        {
            InitializeComponent();

            LoadTestTasks();
            LoadDashboardData();
        }

        private void LoadDashboardData()
        {
            // Ideiglenes tesztadatok
            TaskCountText.Text = "125";
            ExamSetCountText.Text = "10";
            UserCountText.Text = "48";
            ReviewCountText.Text = "7";
        }

        private void LoadTestTasks()
        {
            _tasks.Add(new TaskItem
            {
                Id = 1,
                Title = "Athén és Periklész",
                Subject = "Történelem",
                Topic = "Ókori Görögország",
                Status = "Ellenőrzött"
            });

            _tasks.Add(new TaskItem
            {
                Id = 2,
                Title = "A reformáció",
                Subject = "Történelem",
                Topic = "Kora újkor",
                Status = "Ellenőrzésre vár"
            });

            _tasks.Add(new TaskItem
            {
                Id = 3,
                Title = "Arany János – balladák",
                Subject = "Irodalom",
                Topic = "19. századi irodalom",
                Status = "Ellenőrzött"
            });

            _tasks.Add(new TaskItem
            {
                Id = 4,
                Title = "A Nyugat első nemzedéke",
                Subject = "Irodalom",
                Topic = "20. századi irodalom",
                Status = "Ellenőrzésre vár"
            });
        }

        private void DashboardButton_Click(object sender, RoutedEventArgs e)
        {
            ContentArea.Content = DashboardContent;
        }

        private void TasksButton_Click(object sender, RoutedEventArgs e)
        {
            ShowTasksPage();
        }

        private void ExamSetsButton_Click(object sender, RoutedEventArgs e)
        {
            ShowPage("Érettségi feladatsorok", "Komplett érettségi feladatsorok kezelése.");
        }

        private void SubjectsButton_Click(object sender, RoutedEventArgs e)
        {
            ShowPage("Tantárgyak", "A Tudástér tantárgyainak kezelése.");
        }

        private void TopicsButton_Click(object sender, RoutedEventArgs e)
        {
            ShowPage("Témakörök", "A tananyag témaköreinek kezelése.");
        }

        private void ImportButton_Click(object sender, RoutedEventArgs e)
        {
            ShowPage("Importálás", "Feladatok és dokumentumok importálása.");
        }

        private void UsersButton_Click(object sender, RoutedEventArgs e)
        {
            ShowPage("Felhasználók", "A Tudástér felhasználóinak kezelése.");
        }

        private void StatisticsButton_Click(object sender, RoutedEventArgs e)
        {
            ShowPage("Statisztikák", "Felhasználói és rendszerstatisztikák.");
        }

        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            ShowPage("Beállítások", "A rendszer beállításainak kezelése.");
        }

        private void ShowPage(string title, string description)
        {
            StackPanel panel = new StackPanel();

            TextBlock titleText = new TextBlock
            {
                Text = title,
                FontSize = 28,
                FontWeight = FontWeights.Bold,
                Foreground = (System.Windows.Media.Brush)FindResource("TextBrush")
            };

            TextBlock descriptionText = new TextBlock
            {
                Text = description,
                FontSize = 14,
                Foreground = (System.Windows.Media.Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(0, 8, 0, 30)
            };

            Border placeholder = new Border
            {
                Background = (System.Windows.Media.Brush)FindResource("WhiteBrush"),
                BorderBrush = (System.Windows.Media.Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(14),
                Padding = new Thickness(30)
            };

            TextBlock placeholderText = new TextBlock
            {
                Text = "Ez az oldal hamarosan elkészül.",
                FontSize = 16,
                Foreground = (System.Windows.Media.Brush)FindResource("MutedTextBrush")
            };

            placeholder.Child = placeholderText;

            panel.Children.Add(titleText);
            panel.Children.Add(descriptionText);
            panel.Children.Add(placeholder);

            ContentArea.Content = panel;
        }

        private void ShowTasksPage()
        {
            StackPanel mainPanel = new StackPanel();

            // Cím
            TextBlock title = new TextBlock
            {
                Text = "Feladatok",
                FontSize = 28,
                FontWeight = FontWeights.Bold,
                Foreground = (System.Windows.Media.Brush)FindResource("TextBrush")
            };

            TextBlock subtitle = new TextBlock
            {
                Text = "A Tudástér feladatainak kezelése.",
                FontSize = 14,
                Foreground = (System.Windows.Media.Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(0, 8, 0, 25)
            };

            // Keresősáv + új feladat gomb
            Grid toolbar = new Grid();

            toolbar.ColumnDefinitions.Add(
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

            toolbar.ColumnDefinitions.Add(
                new ColumnDefinition { Width = GridLength.Auto });

            TextBox searchBox = new TextBox
            {
                Height = 42,
                Padding = new Thickness(14, 0, 14, 0),
                VerticalContentAlignment = VerticalAlignment.Center,
                FontSize = 14,
                BorderBrush = (System.Windows.Media.Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1)
            };
            searchBox.TextChanged += SearchBox_TextChanged;

            searchBox.Text = "Keresés a feladatok között...";

            Button addButton = new Button
            {
                Content = "+  ÚJ FELADAT",
                Height = 42,
                Width = 145,
                Margin = new Thickness(15, 0, 0, 0),
                Background = (System.Windows.Media.Brush)FindResource("PrimaryBrush"),
                Foreground = (System.Windows.Media.Brush)FindResource("WhiteBrush"),
                BorderThickness = new Thickness(0),
                FontWeight = FontWeights.SemiBold,
                Cursor = System.Windows.Input.Cursors.Hand
            };

            addButton.Click += AddTaskButton_Click;

            Button editButton = new Button
            {
                Content = "SZERKESZTÉS",
                Height = 42,
                Width = 140,
                Margin = new Thickness(15, 0, 0, 0),
                Background = (System.Windows.Media.Brush)FindResource("PrimaryLightBrush"),
                Foreground = (System.Windows.Media.Brush)FindResource("WhiteBrush"),
                BorderThickness = new Thickness(0),
                FontWeight = FontWeights.SemiBold,
                Cursor = System.Windows.Input.Cursors.Hand
            };

            editButton.Click += EditTaskButton_Click;

            Grid.SetColumn(searchBox, 0);

            StackPanel buttonPanel = new StackPanel
            {
                Orientation = Orientation.Horizontal
            };

            buttonPanel.Children.Add(addButton);
            buttonPanel.Children.Add(editButton);

            Grid.SetColumn(buttonPanel, 1);

            toolbar.Children.Add(searchBox);
            toolbar.Children.Add(buttonPanel);


            // Táblázat
            _taskGrid = new DataGrid
            {
                Margin = new Thickness(0, 20, 0, 0),
                AutoGenerateColumns = false,
                IsReadOnly = true,
                HeadersVisibility = DataGridHeadersVisibility.Column,
                RowHeight = 48,
                FontSize = 13,
                Background = (Brush)FindResource("WhiteBrush"),
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                SelectionMode = DataGridSelectionMode.Single
            };

            _taskGrid.ItemsSource = _tasks;
            _taskGrid.MouseDoubleClick += TaskGrid_MouseDoubleClick;

            Button deleteButton = new Button
            {
                Content = "KIVÁLASZTOTT FELADAT TÖRLÉSE",
                Height = 42,
                Width = 230,
                Margin = new Thickness(0, 15, 0, 0),
                Background = Brushes.Transparent,
                Foreground = (Brush)FindResource("TextBrush"),
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                FontWeight = FontWeights.SemiBold,
                Cursor = Cursors.Hand
            };

            deleteButton.Click += DeleteTaskButton_Click;

            _taskGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "ID",
                Binding = new System.Windows.Data.Binding("Id"),
                Width = 60
            });

            _taskGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Feladat",
                Binding = new System.Windows.Data.Binding("Title"),
                Width = new DataGridLength(1, DataGridLengthUnitType.Star)
            });

            _taskGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Tantárgy",
                Binding = new System.Windows.Data.Binding("Subject"),
                Width = 130
            });

            _taskGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Témakör",
                Binding = new System.Windows.Data.Binding("Topic"),
                Width = 160
            });

            _taskGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Szint",
                Binding = new System.Windows.Data.Binding("Level"),
                Width = 110
            });

            _taskGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Év",
                Binding = new System.Windows.Data.Binding("Year"),
                Width = 70
            });

            _taskGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Pont",
                Binding = new System.Windows.Data.Binding("Points"),
                Width = 70
            });

            _taskGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Állapot",
                Binding = new System.Windows.Data.Binding("Status"),
                Width = 140
            });

            // Tesztadatok
            


            mainPanel.Children.Add(title);
            mainPanel.Children.Add(subtitle);
            mainPanel.Children.Add(toolbar);
            mainPanel.Children.Add(_taskGrid);
            mainPanel.Children.Add(deleteButton);

            ContentArea.Content = mainPanel;
        }

        public class TaskItem
        {
            public int Id { get; set; }

            public string Title { get; set; } = "";

            public string Subject { get; set; } = "";

            public string Topic { get; set; } = "";

            public string Level { get; set; } = "";

            public string Year { get; set; } = "";

            public string Points { get; set; } = "";

            public string Answer { get; set; } = "";

            public string Explanation { get; set; } = "";

            public string Status { get; set; } = "";
        }

        private void AddTaskButton_Click(object sender, RoutedEventArgs e)
        {
            TaskWindow taskWindow = new TaskWindow
            {
                Owner = this
            };

            bool? result = taskWindow.ShowDialog();

            if (result == true && taskWindow.CreatedTask != null)
            {
                taskWindow.CreatedTask.Id = _nextTaskId++;

                _tasks.Add(taskWindow.CreatedTask);

                _taskGrid?.Items.Refresh();
            }
        }

        private void DeleteTaskButton_Click(object sender, RoutedEventArgs e)
        {
            if (_taskGrid == null)
            {
                return;
            }

            if (_taskGrid.SelectedItem is not TaskItem selectedTask)
            {
                MessageBox.Show(
                    "Először válassz ki egy feladatot.",
                    "Nincs kiválasztott feladat",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);

                return;
            }

            MessageBoxResult result = MessageBox.Show(
                $"Biztosan törölni szeretnéd ezt a feladatot?\n\n{selectedTask.Title}",
                "Feladat törlése",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);

            if (result == MessageBoxResult.Yes)
            {
                _tasks.Remove(selectedTask);
            }
        }

        private void EditTaskButton_Click(object sender, RoutedEventArgs e)
        {
            if (_taskGrid == null)
                return;

            if (_taskGrid.SelectedItem is not TaskItem selectedTask)
            {
                MessageBox.Show(
                    "Először válassz ki egy feladatot.",
                    "Nincs kiválasztott feladat",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);

                return;
            }

            TaskWindow taskWindow = new TaskWindow(selectedTask)
            {
                Owner = this
            };

            bool? result = taskWindow.ShowDialog();

            if (result == true)
            {
                _taskGrid.Items.Refresh();
            }
        }

        private void SearchBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (_taskGrid == null)
                return;

            if (sender is not TextBox searchBox)
                return;

            string searchText = searchBox.Text.Trim().ToLower();

            if (string.IsNullOrWhiteSpace(searchText))
            {
                _taskGrid.ItemsSource = _tasks;
                return;
            }

            var filteredTasks = _tasks.Where(task =>
                task.Title.ToLower().Contains(searchText) ||
                task.Subject.ToLower().Contains(searchText) ||
                task.Topic.ToLower().Contains(searchText) ||
                task.Level.ToLower().Contains(searchText) ||
                task.Year.ToLower().Contains(searchText)
            ).ToList();

            _taskGrid.ItemsSource = filteredTasks;
        }

        private void TaskGrid_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            if (_taskGrid == null)
                return;

            if (_taskGrid.SelectedItem is not TaskItem selectedTask)
                return;

            MessageBox.Show(
                $"Feladat:\n\n{selectedTask.Title}\n\n" +
                $"Tantárgy: {selectedTask.Subject}\n" +
                $"Témakör: {selectedTask.Topic}\n" +
                $"Szint: {selectedTask.Level}\n" +
                $"Év: {selectedTask.Year}\n" +
                $"Pontszám: {selectedTask.Points}\n\n" +
                $"Helyes válasz:\n{selectedTask.Answer}\n\n" +
                $"Magyarázat:\n{selectedTask.Explanation}",
                "Feladat részletei",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        }


    }
}