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
        private readonly ObservableCollection<TopicItem> _topics = new();
        private readonly ObservableCollection<UserItem> _users = new();
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
            LoadTestTopics();
            LoadTestUsers();
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

        private void LoadTestTopics()
        {
            _topics.Clear();

            _topics.Add(new TopicItem
            {
                Id = 1,
                Name = "Ókori Görögország",
                Subject = "Történelem",
                TaskCount = 18
            });

            _topics.Add(new TopicItem
            {
                Id = 2,
                Name = "Kora újkor",
                Subject = "Történelem",
                TaskCount = 22
            });

            _topics.Add(new TopicItem
            {
                Id = 3,
                Name = "19. századi irodalom",
                Subject = "Irodalom",
                TaskCount = 20
            });

            _topics.Add(new TopicItem
            {
                Id = 4,
                Name = "20. századi irodalom",
                Subject = "Irodalom",
                TaskCount = 15
            });
        }
        private void LoadTestUsers()
        {
            _users.Clear();

            _users.Add(new UserItem
            {
                Id = 1,
                Name = "Teszt Elek",
                Email = "teszt.elek@example.com",
                Role = "Diák",
                Status = "Aktív"
            });

            _users.Add(new UserItem
            {
                Id = 2,
                Name = "Minta Anna",
                Email = "minta.anna@example.com",
                Role = "Tanár",
                Status = "Aktív"
            });

            _users.Add(new UserItem
            {
                Id = 3,
                Name = "Demo Béla",
                Email = "demo.bela@example.com",
                Role = "Diák",
                Status = "Inaktív"
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
            ShowTopicsPage();
        }

        private void ImportButton_Click(object sender, RoutedEventArgs e)
        {
            ShowImportPage();
        }

        private void UsersButton_Click(object sender, RoutedEventArgs e)
        {
            ShowUsersPage();
        }

        private void StatisticsButton_Click(object sender, RoutedEventArgs e)
        {
            ShowStatisticsPage();
        }

        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            ShowSettingsPage();
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
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            var searchBorder = new Border
            {
                Height = 42,
                Width = 320,
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Margin = new Thickness(0, 0, 0, 20),
                Child = searchBox
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
                mainPanel.Children.Add(searchBorder);

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
            };

            mainPanel.Children.Add(searchBorder);

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

        private void ShowSettingsPage()
        {
            PageTitleText.Text = "Beállítások";
            PageSubtitleText.Text = "A Tudástér adminisztrációs alkalmazás beállításai.";

            var mainPanel = new StackPanel();

            // Értesítések
            var notificationCard = new Border
            {
                Background = Brushes.White,
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(20),
                Margin = new Thickness(0, 0, 0, 15)
            };

            var notificationPanel = new StackPanel();

            notificationPanel.Children.Add(new TextBlock
            {
                Text = "Értesítések",
                FontSize = 18,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("TextBrush")
            });

            notificationPanel.Children.Add(new TextBlock
            {
                Text = "Rendszerértesítések megjelenítése.",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(0, 5, 0, 15)
            });

            var notificationCheckBox = new CheckBox
            {
                Content = "Értesítések engedélyezése",
                IsChecked = true,
                FontSize = 14,
                Foreground = (Brush)FindResource("TextBrush")
            };

            notificationPanel.Children.Add(notificationCheckBox);

            notificationCard.Child = notificationPanel;
            mainPanel.Children.Add(notificationCard);


            // Automatikus mentés
            var backupCard = new Border
            {
                Background = Brushes.White,
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(20),
                Margin = new Thickness(0, 0, 0, 15)
            };

            var backupPanel = new StackPanel();

            backupPanel.Children.Add(new TextBlock
            {
                Text = "Automatikus mentés",
                FontSize = 18,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("TextBrush")
            });

            backupPanel.Children.Add(new TextBlock
            {
                Text = "Az alkalmazás adatainak automatikus mentése.",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(0, 5, 0, 15)
            });

            var backupCheckBox = new CheckBox
            {
                Content = "Automatikus mentés engedélyezése",
                IsChecked = true,
                FontSize = 14,
                Foreground = (Brush)FindResource("TextBrush")
            };

            backupPanel.Children.Add(backupCheckBox);

            backupPanel.Children.Add(new TextBlock
            {
                Text = "Mentés gyakorisága",
                FontSize = 14,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 20, 0, 8)
            });

            var backupComboBox = new ComboBox
            {
                Width = 180,
                Height = 38,
                FontSize = 14
            };

            backupComboBox.Items.Add("5 perc");
            backupComboBox.Items.Add("15 perc");
            backupComboBox.Items.Add("30 perc");
            backupComboBox.Items.Add("60 perc");

            backupComboBox.SelectedIndex = 1;

            backupPanel.Children.Add(backupComboBox);

            backupCard.Child = backupPanel;
            mainPanel.Children.Add(backupCard);


            // Alkalmazás információ
            var infoCard = new Border
            {
                Background = Brushes.White,
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(20),
                Margin = new Thickness(0, 0, 0, 15)
            };

            var infoPanel = new StackPanel();

            infoPanel.Children.Add(new TextBlock
            {
                Text = "Alkalmazás információ",
                FontSize = 18,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("TextBrush")
            });

            infoPanel.Children.Add(new TextBlock
            {
                Text = "Tudástér Admin",
                FontSize = 15,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 12, 0, 5)
            });

            infoPanel.Children.Add(new TextBlock
            {
                Text = "Adminisztrációs alkalmazás",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush")
            });

            infoPanel.Children.Add(new TextBlock
            {
                Text = "Verzió: 1.0.0",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(0, 5, 0, 0)
            });

            infoCard.Child = infoPanel;
            mainPanel.Children.Add(infoCard);


            // Mentés gomb
            var saveButton = new Button
            {
                Content = "BEÁLLÍTÁSOK MENTÉSE",
                Width = 220,
                Height = 42,
                HorizontalAlignment = HorizontalAlignment.Left,
                Margin = new Thickness(0, 5, 0, 20)
            };

            saveButton.Click += (sender, e) =>
            {
                MessageBox.Show(
                    "A beállítások mentése sikeres.",
                    "Beállítások",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
            };

            mainPanel.Children.Add(saveButton);


            var scrollViewer = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = mainPanel
            };

            ContentArea.Content = scrollViewer;
        }

        private void ShowStatisticsPage()
        {
            PageTitleText.Text = "Statisztikák";
            PageSubtitleText.Text = "A Tudástér rendszer adatainak összesítése.";

            var mainPanel = new StackPanel();

            int totalTasks = _tasks.Count;
            int totalExamSets = _examSets.Count;
            int totalSubjects = _subjects.Count;
            int totalUsers = _users.Count;

            int checkedTasks = _tasks.Count(t => t.Status == "Ellenőrzött");
            int pendingTasks = _tasks.Count(t => t.Status == "Ellenőrzésre vár");

            var title = new TextBlock
            {
                Text = "Rendszer áttekintése",
                FontSize = 22,
                FontWeight = FontWeights.Bold,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 0, 0, 20)
            };

            mainPanel.Children.Add(title);

            var statsGrid = new Grid();

            for (int i = 0; i < 4; i++)
            {
                statsGrid.ColumnDefinitions.Add(
                    new ColumnDefinition
                    {
                        Width = new GridLength(1, GridUnitType.Star)
                    });
            }

            AddStatisticCard(
                statsGrid,
                0,
                "FELADATOK",
                totalTasks.ToString());

            AddStatisticCard(
                statsGrid,
                1,
                "FELADATSOROK",
                totalExamSets.ToString());

            AddStatisticCard(
                statsGrid,
                2,
                "TANTÁRGYAK",
                totalSubjects.ToString());

            AddStatisticCard(
                statsGrid,
                3,
                "FELHASZNÁLÓK",
                totalUsers.ToString());

            mainPanel.Children.Add(statsGrid);

            var taskStatusTitle = new TextBlock
            {
                Text = "Feladatok állapota",
                FontSize = 20,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 30, 0, 15)
            };

            mainPanel.Children.Add(taskStatusTitle);

            var statusGrid = new Grid();

            statusGrid.ColumnDefinitions.Add(
                new ColumnDefinition
                {
                    Width = new GridLength(1, GridUnitType.Star)
                });

            statusGrid.ColumnDefinitions.Add(
                new ColumnDefinition
                {
                    Width = new GridLength(1, GridUnitType.Star)
                });

            AddStatisticCard(
                statusGrid,
                0,
                "ELLENŐRZÖTT",
                checkedTasks.ToString());

            AddStatisticCard(
                statusGrid,
                1,
                "ELLENŐRZÉSRE VÁR",
                pendingTasks.ToString());

            mainPanel.Children.Add(statusGrid);

            var subjectTitle = new TextBlock
            {
                Text = "Feladatok tantárgyanként",
                FontSize = 20,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 30, 0, 15)
            };

            mainPanel.Children.Add(subjectTitle);

            foreach (var subject in _subjects)
            {
                var subjectCard = new Border
                {
                    Background = Brushes.White,
                    CornerRadius = new CornerRadius(12),
                    Padding = new Thickness(20),
                    Margin = new Thickness(0, 0, 0, 10)
                };

                var subjectPanel = new StackPanel();

                subjectPanel.Children.Add(new TextBlock
                {
                    Text = subject.Name,
                    FontSize = 17,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = (Brush)FindResource("TextBrush")
                });

                subjectPanel.Children.Add(new TextBlock
                {
                    Text = $"{subject.TaskCount} feladat",
                    FontSize = 14,
                    Foreground = (Brush)FindResource("MutedTextBrush"),
                    Margin = new Thickness(0, 5, 0, 0)
                });

                subjectCard.Child = subjectPanel;

                mainPanel.Children.Add(subjectCard);
            }

            var scrollViewer = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = mainPanel
            };

            ContentArea.Content = scrollViewer;
        }

        private void AddStatisticCard(
            Grid grid,
            int column,
            string title,
            string value)
        {
            var card = new Border
            {
                Background = Brushes.White,
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(20),
                Margin = new Thickness(0, 0, 10, 0)
            };

            var panel = new StackPanel();

            panel.Children.Add(new TextBlock
            {
                Text = title,
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("MutedTextBrush")
            });

            panel.Children.Add(new TextBlock
            {
                Text = value,
                FontSize = 28,
                FontWeight = FontWeights.Bold,
                Foreground = (Brush)FindResource("PrimaryBrush"),
                Margin = new Thickness(0, 5, 0, 0)
            });

            card.Child = panel;

            Grid.SetColumn(card, column);
            grid.Children.Add(card);
        }
        private void ShowImportPage()
        {
            PageTitleText.Text = "Importálás";
            PageSubtitleText.Text = "Érettségi feladatsorok és dokumentumok importálása.";

            var mainPanel = new StackPanel();

            var infoText = new TextBlock
            {
                Text = "Válassz ki egy dokumentumot az importáláshoz.",
                FontSize = 16,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 0, 0, 15)
            };

            var fileNameText = new TextBlock
            {
                Text = "Nincs kiválasztott fájl.",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(0, 0, 0, 20)
            };

            var selectButton = new Button
            {
                Content = "FÁJL KIVÁLASZTÁSA",
                Width = 190,
                Height = 42,
                Margin = new Thickness(0, 0, 0, 15)
            };

            var processButton = new Button
            {
                Content = "FELDOLGOZÁS INDÍTÁSA",
                Width = 210,
                Height = 42,
                IsEnabled = false
            };

            selectButton.Click += (sender, e) =>
            {
                var dialog = new Microsoft.Win32.OpenFileDialog
                {
                    Title = "Dokumentum kiválasztása",
                    Filter = "Dokumentumok|*.pdf;*.docx;*.txt|Minden fájl|*.*"
                };

                if (dialog.ShowDialog() == true)
                {
                    fileNameText.Text = dialog.FileName;
                    processButton.IsEnabled = true;
                }
            };

            processButton.Click += (sender, e) =>
            {
                MessageBox.Show(
                    "A fájl feldolgozása elindult.",
                    "Importálás",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
            };

            mainPanel.Children.Add(infoText);
            mainPanel.Children.Add(fileNameText);
            mainPanel.Children.Add(selectButton);
            mainPanel.Children.Add(processButton);

            var scrollViewer = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = mainPanel
            };

            ContentArea.Content = scrollViewer;
        }

        private void ShowTopicsPage()
        {
            PageTitleText.Text = "Témakörök";
            PageSubtitleText.Text = "A Tudástér témaköreinek áttekintése.";

            var mainPanel = new StackPanel();

            var searchBox = new TextBox
            {
                Height = 42,
                FontSize = 14,
                Padding = new Thickness(12, 0, 12, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            var searchBorder = new Border
            {
                Height = 42,
                Width = 320,
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Margin = new Thickness(0, 0, 0, 20),
                Child = searchBox
            };

            searchBox.TextChanged += (sender, e) =>
            {
                string searchText = searchBox.Text.Trim();

                var filteredTopics = _topics
                    .Where(topic =>
                        topic.Name.Contains(
                            searchText,
                            StringComparison.OrdinalIgnoreCase) ||
                        topic.Subject.Contains(
                            searchText,
                            StringComparison.OrdinalIgnoreCase))
                    .ToList();

                mainPanel.Children.Clear();
                mainPanel.Children.Add(searchBorder);

                foreach (var topic in filteredTopics)
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
                        Text = topic.Name,
                        FontSize = 18,
                        FontWeight = FontWeights.SemiBold,
                        Foreground = (Brush)FindResource("TextBrush")
                    });

                    panel.Children.Add(new TextBlock
                    {
                        Text = $"{topic.Subject} • {topic.TaskCount} feladat",
                        FontSize = 14,
                        Foreground = (Brush)FindResource("MutedTextBrush"),
                        Margin = new Thickness(0, 5, 0, 0)
                    });

                    card.Child = panel;
                    mainPanel.Children.Add(card);
                }
            };

            mainPanel.Children.Add(searchBorder);

            foreach (var topic in _topics)
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
                    Text = topic.Name,
                    FontSize = 18,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = (Brush)FindResource("TextBrush")
                });

                panel.Children.Add(new TextBlock
                {
                    Text = $"{topic.Subject} • {topic.TaskCount} feladat",
                    FontSize = 14,
                    Foreground = (Brush)FindResource("MutedTextBrush"),
                    Margin = new Thickness(0, 5, 0, 0)
                });

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

        private void ShowUsersPage()
        {
            PageTitleText.Text = "Felhasználók";
            PageSubtitleText.Text = "A Tudástér felhasználóinak áttekintése.";

            var mainPanel = new StackPanel();

            var searchBox = new TextBox
            {
                Height = 42,
                FontSize = 14,
                Padding = new Thickness(12, 0, 12, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            var searchBorder = new Border
            {
                Height = 42,
                Width = 320,
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Margin = new Thickness(0, 0, 0, 20),
                Child = searchBox
            };

            void DisplayUsers(IEnumerable<UserItem> users)
            {
                mainPanel.Children.Clear();
                mainPanel.Children.Add(searchBorder);

                foreach (var user in users)
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
                        Text = user.Name,
                        FontSize = 18,
                        FontWeight = FontWeights.SemiBold,
                        Foreground = (Brush)FindResource("TextBrush")
                    });

                    panel.Children.Add(new TextBlock
                    {
                        Text = user.Email,
                        FontSize = 14,
                        Foreground = (Brush)FindResource("MutedTextBrush"),
                        Margin = new Thickness(0, 5, 0, 0)
                    });

                    panel.Children.Add(new TextBlock
                    {
                        Text = $"{user.Role} • {user.Status}",
                        FontSize = 14,
                        Foreground = (Brush)FindResource("MutedTextBrush"),
                        Margin = new Thickness(0, 5, 0, 0)
                    });

                    card.Child = panel;
                    mainPanel.Children.Add(card);
                }
            }

            searchBox.TextChanged += (sender, e) =>
            {
                string searchText = searchBox.Text.Trim();

                var filteredUsers = _users
                    .Where(user =>
                        user.Name.Contains(
                            searchText,
                            StringComparison.OrdinalIgnoreCase) ||
                        user.Email.Contains(
                            searchText,
                            StringComparison.OrdinalIgnoreCase) ||
                        user.Role.Contains(
                            searchText,
                            StringComparison.OrdinalIgnoreCase) ||
                        user.Status.Contains(
                            searchText,
                            StringComparison.OrdinalIgnoreCase))
                    .ToList();

                DisplayUsers(filteredUsers);
            };

            DisplayUsers(_users);

            var scrollViewer = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = mainPanel
            };

            ContentArea.Content = scrollViewer;
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

        public class TopicItem
        {
            public int Id { get; set; }
            public string Name { get; set; } = "";
            public string Subject { get; set; } = "";
            public int TaskCount { get; set; }
        }

        public class UserItem
        {
            public int Id { get; set; }
            public string Name { get; set; } = "";
            public string Email { get; set; } = "";
            public string Role { get; set; } = "";
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