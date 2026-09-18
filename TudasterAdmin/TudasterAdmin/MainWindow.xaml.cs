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
        private readonly ObservableCollection<ExamSetItem> _examSets = new();
        private readonly ObservableCollection<SubjectItem> _subjects = new();
        private int _nextTaskId = 5;
        private DataGrid? _taskGrid;
        private DataGrid? _examSetGrid;

        private TextBox? _examSetSearchBox;
        private TextBox? _taskSearchBox;
        private ComboBox? _taskStatusFilter;
        private ComboBox? _taskSubjectFilter;
        private ComboBox? _taskLevelFilter;
        public MainWindow()
        {
            InitializeComponent();
            LoadTestTasks();
            LoadTestExamSets();
            LoadTestSubjects();
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

        private void LoadTestExamSets()
        {
            _examSets.Add(new ExamSetItem
            {
                Id = 1,
                Year = "2025",
                Subject = "Történelem",
                Level = "Középszint",
                Type = "Írásbeli",
                Title = "2025. májusi történelem érettségi",
                TaskCount = 30,
                Status = "Ellenőrzött"
            });

            _examSets.Add(new ExamSetItem
            {
                Id = 2,
                Year = "2025",
                Subject = "Irodalom",
                Level = "Emelt szint",
                Type = "Írásbeli",
                Title = "2025. májusi magyar nyelv és irodalom",
                TaskCount = 28,
                Status = "Ellenőrzésre vár"
            });

            _examSets.Add(new ExamSetItem
            {
                Id = 3,
                Year = "2024",
                Subject = "Történelem",
                Level = "Emelt szint",
                Type = "Írásbeli",
                Title = "2024. májusi történelem érettségi",
                TaskCount = 32,
                Status = "Ellenőrzött"
            });
        }

        private void LoadTestSubjects()
        {
            _subjects.Clear();

            _subjects.Add(new SubjectItem
            {
                Id = 1,
                Name = "Történelem",
                TaskCount = 65
            });

            _subjects.Add(new SubjectItem
            {
                Id = 2,
                Name = "Irodalom",
                TaskCount = 60
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
            ShowExamSetsPage();
        }

        private void SubjectsButton_Click(object sender, RoutedEventArgs e)
        {
            ShowSubjectsPage();
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

        private void ShowSubjectsPage()
        {
            PageTitleText.Text = "Tantárgyak";
            PageSubtitleText.Text = "A Tudástér tantárgyainak áttekintése.";

            var mainPanel = new StackPanel();
            var searchBox = new TextBox
            {
                Height = 42,
                FontSize = 14,
                Padding = new Thickness(12, 0, 12, 0),
                Margin = new Thickness(0, 0, 0, 20),
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            searchBox.TextChanged += (sender, e) =>
            {
                string searchText = searchBox.Text.Trim();

                var filteredSubjects = _subjects
                    .Where(subject =>
                        subject.Name.Contains(
                            searchText,
                            StringComparison.OrdinalIgnoreCase))
                    .ToList();

                mainPanel.Children.Clear();
                mainPanel.Children.Add(searchBox);

                foreach (var subject in filteredSubjects)
                {
                    var card = new Border
                    {
                        Background = Brushes.White,
                        CornerRadius = new CornerRadius(12),
                        Padding = new Thickness(20),
                        Margin = new Thickness(0, 0, 0, 12)
                    };

                    var panel = new StackPanel();

                    panel.Children.Add(new TextBlock
                    {
                        Text = subject.Name,
                        FontSize = 18,
                        FontWeight = FontWeights.SemiBold,
                        Foreground = (Brush)FindResource("TextBrush")
                    });

                    panel.Children.Add(new TextBlock
                    {
                        Text = $"{subject.TaskCount} feladat",
                        FontSize = 14,
                        Foreground = (Brush)FindResource("MutedTextBrush"),
                        Margin = new Thickness(0, 5, 0, 0)
                    });

                    card.Child = panel;
                    mainPanel.Children.Add(card);
                }
            };

            foreach (var subject in _subjects)
            {
                var card = new Border
                {
                    Background = Brushes.White,
                    CornerRadius = new CornerRadius(12),
                    Padding = new Thickness(20),
                    Margin = new Thickness(0, 0, 0, 12)
                };

                var panel = new StackPanel();

                var nameText = new TextBlock
                {
                    Text = subject.Name,
                    FontSize = 18,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = (Brush)FindResource("TextBrush")
                };

                var countText = new TextBlock
                {
                    Text = $"{subject.TaskCount} feladat",
                    FontSize = 14,
                    Foreground = (Brush)FindResource("MutedTextBrush"),
                    Margin = new Thickness(0, 5, 0, 0)
                };

                panel.Children.Add(nameText);
                panel.Children.Add(countText);

                card.Child = panel;
                mainPanel.Children.Add(card);
            }

            var scrollViewer = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = mainPanel
            };

            ContentArea.Content = scrollViewer;
        }

        private void ShowExamSetsPage()
        {
            PageTitleText.Text = "Érettségi feladatsorok";
            PageSubtitleText.Text = "Komplett érettségi feladatsorok kezelése.";

            StackPanel mainPanel = new StackPanel();

            // Felső sáv
            Grid toolbar = new Grid
            {
                Margin = new Thickness(0, 0, 0, 20)
            };

            toolbar.ColumnDefinitions.Add(
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

            toolbar.ColumnDefinitions.Add(
                new ColumnDefinition { Width = GridLength.Auto });

            // Kereső
            Border searchBorder = new Border
            {
                Width = 320,
                Height = 44,
                Background = (Brush)FindResource("WhiteBrush"),
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(12, 0, 12, 0)
            };

            _examSetSearchBox = new TextBox
            {
                BorderThickness = new Thickness(0),
                Background = Brushes.Transparent,
                VerticalContentAlignment = VerticalAlignment.Center,
                FontSize = 14
            };

            _examSetSearchBox.TextChanged += ExamSetSearchBox_TextChanged;

            searchBorder.Child = _examSetSearchBox;

            Grid.SetColumn(searchBorder, 0);
            toolbar.Children.Add(searchBorder);

            // Új feladatsor
            



            // Táblázat
            _examSetGrid = new DataGrid
            {
                AutoGenerateColumns = false,
                IsReadOnly = true,
                HeadersVisibility = DataGridHeadersVisibility.Column,
                RowHeight = 52,
                FontSize = 13,
                Background = (Brush)FindResource("WhiteBrush"),
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                GridLinesVisibility = DataGridGridLinesVisibility.Horizontal,
                HorizontalGridLinesBrush = (Brush)FindResource("BorderBrush"),
                VerticalGridLinesBrush = Brushes.Transparent,
                SelectionMode = DataGridSelectionMode.Single,
                SelectionUnit = DataGridSelectionUnit.FullRow,
                CanUserAddRows = false,
                CanUserResizeRows = false,
                CanUserReorderColumns = false
            };

            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "ID",
                Binding = new Binding("Id"),
                Width = 60
            });

            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Év",
                Binding = new Binding("Year"),
                Width = 70
            });

            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Tantárgy",
                Binding = new Binding("Subject"),
                Width = 130
            });

            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Szint",
                Binding = new Binding("Level"),
                Width = 120
            });

            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Típus",
                Binding = new Binding("Type"),
                Width = 110
            });

            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Feladatsor",
                Binding = new Binding("Title"),
                Width = new DataGridLength(1, DataGridLengthUnitType.Star)
            });

            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Feladatok",
                Binding = new Binding("TaskCount"),
                Width = 100
            });

            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Állapot",
                Binding = new Binding("Status"),
                Width = 140
            });

            _examSetGrid.ItemsSource = _examSets;

            // Törlés gomb
            



            mainPanel.Children.Add(toolbar);
            mainPanel.Children.Add(_examSetGrid);


            ContentArea.Content = mainPanel;
        }

        private void ShowTasksPage()
        {

            PageTitleText.Text = "Feladatok";
            PageSubtitleText.Text = "A Tudástér feladatainak kezelése.";
            StackPanel mainPanel = new StackPanel();
            

            // Cím
           

            // Keresősáv + új feladat gomb
            Grid toolbar = new Grid
            {
                Margin = new Thickness(0, 0, 0, 20)
            };

            toolbar.ColumnDefinitions.Add(
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

            toolbar.ColumnDefinitions.Add(
                new ColumnDefinition { Width = GridLength.Auto });

            toolbar.ColumnDefinitions.Add(
                new ColumnDefinition { Width = GridLength.Auto });

            toolbar.ColumnDefinitions.Add(
                new ColumnDefinition { Width = GridLength.Auto });

            toolbar.ColumnDefinitions.Add(
                new ColumnDefinition { Width = GridLength.Auto });


            // KERESŐ
            Border searchBorder = new Border
            {
                Width = 320,
                Height = 44,
                Background = (Brush)FindResource("WhiteBrush"),
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(12, 0, 12, 0)
            };

            _taskSearchBox = new TextBox
            {
                BorderThickness = new Thickness(0),
                Background = Brushes.Transparent,
                VerticalContentAlignment = VerticalAlignment.Center,
                FontSize = 14
            };

            _taskSearchBox.TextChanged += SearchBox_TextChanged;

            searchBorder.Child = _taskSearchBox;

            Grid.SetColumn(searchBorder, 0);
            toolbar.Children.Add(searchBorder);


            // ÁLLAPOT SZŰRŐ
            Border filterBorder = new Border
            {
                Width = 190,
                Height = 44,
                Margin = new Thickness(12, 0, 0, 0),
                Background = (Brush)FindResource("WhiteBrush"),
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10)
            };

            _taskStatusFilter = new ComboBox
            {
                BorderThickness = new Thickness(0),
                Background = Brushes.Transparent,
                FontSize = 13,
                VerticalContentAlignment = VerticalAlignment.Center
            };

            _taskStatusFilter.Items.Add("Összes állapot");
            _taskStatusFilter.Items.Add("Ellenőrzött");
            _taskStatusFilter.Items.Add("Ellenőrzésre vár");

            _taskStatusFilter.SelectedIndex = 0;
            _taskStatusFilter.SelectionChanged += StatusFilter_SelectionChanged;
            Border subjectFilterBorder = new Border
            {
                Width = 170,
                Height = 44,
                Margin = new Thickness(12, 0, 0, 0),
                Background = (Brush)FindResource("WhiteBrush"),
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10)
            };

            _taskSubjectFilter = new ComboBox
            {
                BorderThickness = new Thickness(0),
                Background = Brushes.Transparent,
                FontSize = 13,
                VerticalContentAlignment = VerticalAlignment.Center
            };

            _taskSubjectFilter.Items.Add("Összes tantárgy");
            _taskSubjectFilter.Items.Add("Történelem");
            _taskSubjectFilter.Items.Add("Irodalom");

            _taskSubjectFilter.SelectedIndex = 0;

            _taskSubjectFilter.SelectionChanged += SubjectFilter_SelectionChanged;

            subjectFilterBorder.Child = _taskSubjectFilter;
            Border levelFilterBorder = new Border
            {
                Width = 150,
                Height = 44,
                Margin = new Thickness(12, 0, 0, 0),
                Background = (Brush)FindResource("WhiteBrush"),
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10)
            };

            _taskLevelFilter = new ComboBox
            {
                BorderThickness = new Thickness(0),
                Background = Brushes.Transparent,
                FontSize = 13,
                VerticalContentAlignment = VerticalAlignment.Center
            };

            _taskLevelFilter.Items.Add("Összes szint");
            _taskLevelFilter.Items.Add("Középszint");
            _taskLevelFilter.Items.Add("Emelt szint");

            _taskLevelFilter.SelectedIndex = 0;

            _taskLevelFilter.SelectionChanged += LevelFilter_SelectionChanged;

            levelFilterBorder.Child = _taskLevelFilter;

            filterBorder.Child = _taskStatusFilter;

            Grid.SetColumn(filterBorder, 1);
            toolbar.Children.Add(filterBorder);
            Grid.SetColumn(subjectFilterBorder, 2);
            toolbar.Children.Add(subjectFilterBorder);
            Grid.SetColumn(levelFilterBorder, 3);
            toolbar.Children.Add(levelFilterBorder);


            // GOMBOK
            StackPanel buttonPanel = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                HorizontalAlignment = HorizontalAlignment.Right
            };


            // ÚJ FELADAT
            Button addButton = new Button
            {
                Content = "+  ÚJ FELADAT",
                Height = 44,
                Width = 145,
                Background = (Brush)FindResource("PrimaryBrush"),
                Foreground = (Brush)FindResource("WhiteBrush"),
                BorderThickness = new Thickness(0),
                FontWeight = FontWeights.SemiBold,
                FontSize = 13,
                Cursor = Cursors.Hand
            };

            addButton.Click += AddTaskButton_Click;


            // SZERKESZTÉS
            Button editButton = new Button
            {
                Content = "SZERKESZTÉS",
                Height = 44,
                Width = 140,
                Margin = new Thickness(10, 0, 0, 0),
                Background = (Brush)FindResource("PrimaryLightBrush"),
                Foreground = (Brush)FindResource("WhiteBrush"),
                BorderThickness = new Thickness(0),
                FontWeight = FontWeights.SemiBold,
                FontSize = 13,
                Cursor = Cursors.Hand
            };

            editButton.Click += EditTaskButton_Click;

            buttonPanel.Children.Add(addButton);
            buttonPanel.Children.Add(editButton);

            Grid.SetColumn(buttonPanel, 4);
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

        public class ExamSetItem
        {
            public int Id { get; set; }
            public string Year { get; set; } = "";
            public string Subject { get; set; } = "";
            public string Level { get; set; } = "";
            public string Type { get; set; } = "";
            public string Title { get; set; } = "";
            public int TaskCount { get; set; }
            public string Status { get; set; } = "";
        }

        public class SubjectItem
        {
            public int Id { get; set; }
            public string Name { get; set; } = "";
            public int TaskCount { get; set; }
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
            ApplyTaskFilters();
        }

        private void StatusFilter_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            ApplyTaskFilters();
        }

        private void TaskGrid_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            if (_taskGrid == null)
                return;

            if (_taskGrid.SelectedItem is not TaskItem selectedTask)
                return;

            TaskDetailsWindow detailsWindow =
                new TaskDetailsWindow(selectedTask)
                {
                    Owner = this
                };

            detailsWindow.ShowDialog();
        }


        private void ApplyTaskFilters()
        {
            if (_taskGrid == null)
                return;

            string searchText = _taskSearchBox?.Text?.Trim() ?? "";

            string selectedStatus =
                _taskStatusFilter?.SelectedItem?.ToString()
                ?? "Összes állapot";

            string selectedSubject =
                _taskSubjectFilter?.SelectedItem?.ToString()
                ?? "Összes tantárgy";

            string selectedLevel =
                _taskLevelFilter?.SelectedItem?.ToString()
                ?? "Összes szint";

            IEnumerable<TaskItem> result = _tasks;

 

            // Keresés
            if (!string.IsNullOrWhiteSpace(searchText))
            {
                result = result.Where(task =>
                    task.Title.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                    task.Subject.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                    task.Topic.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                    task.Level.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                    task.Year.Contains(searchText, StringComparison.OrdinalIgnoreCase)
                );
            }

            // Állapot szerinti szűrés
            if (selectedSubject != "Összes tantárgy")
            {
                result = result.Where(task =>
                    task.Subject == selectedSubject);
            }

            if (selectedLevel != "Összes szint")
            {
                result = result.Where(task =>
                    task.Level == selectedLevel);
            }

            _taskGrid.ItemsSource = result.ToList();
        }

        private void ApplyExamSetFilter()
        {
            if (_examSetGrid == null)
                return;

            string searchText = _examSetSearchBox?.Text?.Trim() ?? "";

            if (string.IsNullOrWhiteSpace(searchText))
            {
                _examSetGrid.ItemsSource = _examSets;
                return;
            }

            var result = _examSets.Where(examSet =>
                examSet.Year.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                examSet.Subject.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                examSet.Level.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                examSet.Type.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                examSet.Title.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                examSet.Status.Contains(searchText, StringComparison.OrdinalIgnoreCase)
            ).ToList();

            _examSetGrid.ItemsSource = result;
        }

        private void SubjectFilter_SelectionChanged(object sender,SelectionChangedEventArgs e)
                {
                    ApplyTaskFilters();
                }

        private void LevelFilter_SelectionChanged(object sender,SelectionChangedEventArgs e)
                {
                    ApplyTaskFilters();
                }

        private void ExamSetSearchBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            ApplyExamSetFilter();
        }
    }
}