using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using TudasterAdmin.Processing;
using static TudasterAdmin.MainWindow;



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

        private readonly List<string> _localTaskTypes = new();

        private readonly List<LocalTopic> _localTopics = new();
        private readonly List<int> _hiddenTopicIds = new();

        private readonly List<string> _localSubjects = new();
        private readonly List<int> _hiddenSubjectIds = new();

        private static string LocalSubjectsPath => System.IO.Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "TudasterAdmin", "tantargyak_local.json");

        private static string HiddenSubjectsPath => System.IO.Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "TudasterAdmin", "tantargyak_hidden_local.json");
        private static string LocalTopicsPath => System.IO.Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "TudasterAdmin", "temakorok_local.json");

        private static string HiddenTopicsPath => System.IO.Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "TudasterAdmin", "temakorok_hidden_local.json");


        private static string LocalTypesPath => System.IO.Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "TudasterAdmin", "feladat_tipusok_local.json");

        // Egyetlen közös HttpClient példány a backend hívásokhoz
        private static readonly HttpClient _httpClient = new HttpClient();

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
            _ = LoadSubjectsAsync();
            _ = LoadDashboardDataAsync();
            _ = LoadTopicsAsync();
            _ = LoadUsersAsync();
            LoadLocalTaskTypes();
            LoadLocalTopics();
            LoadLocalSubjects();
        }

        private async Task<T> GetFromBackendAsync<T>(string path)
        {
            string url = $"{ApiConfig.BackendApiUrl}/adminroutes/{path}";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", SessionStore.AccessToken);

            HttpResponseMessage response = await _httpClient.SendAsync(request);
            string responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"{path} hívás sikertelen ({(int)response.StatusCode}): {responseBody}");
            }

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            return JsonSerializer.Deserialize<T>(responseBody, options)
                ?? throw new Exception("A backend üres választ adott vissza.");
        }
        private int GetPendingDraftCount()
        {
            var drafts = DraftStore.List();

            int pendingCount = 0;

            foreach (var draftInfo in drafts)
            {
                var draft = DraftStore.Load(draftInfo.Id);

                if (draft == null)
                    continue;

                // Van még jóvá nem hagyott feladat?
                bool hasUnapprovedTasks =
                    draftInfo.ApprovedCount < draftInfo.TaskCount;

                // Van még hiányzó megoldókulcs?
                bool hasMissingSolutions =
                    draft.Tasks.Any(t => !DraftValidator.HasSolution(t));

                // Egy piszkozatot csak egyszer számolunk.
                if (hasUnapprovedTasks || hasMissingSolutions)
                {
                    pendingCount++;
                }
            }

            return pendingCount;
        }

        private async Task LoadDashboardDataAsync()
        {
            try
            {
                DashboardStatsResponse stats = await GetFromBackendAsync<DashboardStatsResponse>("stats");

                TaskCountText.Text = stats.FeladatokSzama.ToString();
                ExamSetCountText.Text = stats.FeladatsorokSzama.ToString();
                UserCountText.Text = stats.FelhasznalokSzama.ToString();

                // Az "ellenőrzésre váró" számhoz még nincs backend végpont,
                // ezt egyelőre meghagyjuk placeholdernek.
                ReviewCountText.Text = GetPendingDraftCount().ToString();

                DbStatusText.Text = "Csatlakoztatva";
                DbStatusText.Foreground = Brushes.Green;
            }
            catch (Exception ex)
            {
                TaskCountText.Text = "-";
                ExamSetCountText.Text = "-";
                UserCountText.Text = "-";
                ReviewCountText.Text = "-";

                DbStatusText.Text = "Nincs kapcsolat";
                DbStatusText.Foreground = Brushes.Red;

                MessageBox.Show(
                    "Nem sikerült betölteni a dashboard statisztikákat: " + ex.Message,
                    "Hiba",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
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


        private async Task LoadSubjectsAsync()
        {
            try
            {
                var subjects = await GetFromBackendAsync<List<SubjectResponse>>("tantargyak");

                _subjects.Clear();

                foreach (var s in subjects)
                {
                    _subjects.Add(new SubjectItem
                    {
                        Id = s.Id,
                        Name = s.Nev,
                        TaskCount = s.FeladatokSzama
                    });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Nem sikerült betölteni a tantárgyakat: " + ex.Message,
                    "Hiba",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }

        private void LoadLocalSubjects()
        {
            try
            {
                _localSubjects.Clear();
                if (System.IO.File.Exists(LocalSubjectsPath))
                {
                    var list = JsonSerializer.Deserialize<List<string>>(System.IO.File.ReadAllText(LocalSubjectsPath));
                    if (list != null) _localSubjects.AddRange(list);
                }

                _hiddenSubjectIds.Clear();
                if (System.IO.File.Exists(HiddenSubjectsPath))
                {
                    var hidden = JsonSerializer.Deserialize<List<int>>(System.IO.File.ReadAllText(HiddenSubjectsPath));
                    if (hidden != null) _hiddenSubjectIds.AddRange(hidden);
                }
            }
            catch
            {
                // sérült fájl esetén üres lista
            }
        }

        private void SaveLocalSubjects()
        {
            try
            {
                string? dir = System.IO.Path.GetDirectoryName(LocalSubjectsPath);
                if (dir != null) System.IO.Directory.CreateDirectory(dir);

                var options = new JsonSerializerOptions
                {
                    WriteIndented = true,
                    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                };

                System.IO.File.WriteAllText(LocalSubjectsPath, JsonSerializer.Serialize(_localSubjects, options));
                System.IO.File.WriteAllText(HiddenSubjectsPath, JsonSerializer.Serialize(_hiddenSubjectIds, options));
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Nem sikerült elmenteni a tantárgyakat: " + ex.Message,
                    "Mentési hiba",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }

        private void LoadLocalTopics()
        {
            try
            {
                _localTopics.Clear();
                if (System.IO.File.Exists(LocalTopicsPath))
                {
                    var list = JsonSerializer.Deserialize<List<LocalTopic>>(System.IO.File.ReadAllText(LocalTopicsPath));
                    if (list != null) _localTopics.AddRange(list);
                }

                _hiddenTopicIds.Clear();
                if (System.IO.File.Exists(HiddenTopicsPath))
                {
                    var hidden = JsonSerializer.Deserialize<List<int>>(System.IO.File.ReadAllText(HiddenTopicsPath));
                    if (hidden != null) _hiddenTopicIds.AddRange(hidden);
                }
            }
            catch
            {
                // sérült fájl esetén üres lista
            }
        }

        private void SaveLocalTopics()
        {
            try
            {
                string? dir = System.IO.Path.GetDirectoryName(LocalTopicsPath);
                if (dir != null) System.IO.Directory.CreateDirectory(dir);

                var options = new JsonSerializerOptions
                {
                    WriteIndented = true,
                    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                };

                System.IO.File.WriteAllText(LocalTopicsPath, JsonSerializer.Serialize(_localTopics, options));
                System.IO.File.WriteAllText(HiddenTopicsPath, JsonSerializer.Serialize(_hiddenTopicIds, options));
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Nem sikerült elmenteni a témaköröket: " + ex.Message,
                    "Mentési hiba",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }

        private async Task LoadTopicsAsync()
        {
            try
            {
                var topics = await GetFromBackendAsync<List<TopicResponse>>("temakorok");

                _topics.Clear();

                foreach (var t in topics)
                {
                    _topics.Add(new TopicItem
                    {
                        Id = t.Id,
                        Name = t.Nev,
                        Subject = t.TantargyNev ?? "Nincs tantárgy",
                        TaskCount = t.FeladatokSzama
                    });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Nem sikerült betölteni a témaköröket: " + ex.Message,
                    "Hiba",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }

        private async Task LoadUsersAsync()
        {
            try
            {
                var users = await GetFromBackendAsync<List<UserResponse>>("felhasznalok");

                _users.Clear();

                foreach (var u in users)
                {
                    _users.Add(new UserItem
                    {
                        Id = u.Id,
                        Name = !string.IsNullOrWhiteSpace(u.Felhasznalonev) ? u.Felhasznalonev : (u.Email ?? "Ismeretlen"),
                        Email = u.Email ?? "",
                        Role = FormatRole(u.Szerep),
                        Status = u.VanMaiTeszt ? "Aktív" : "Inaktív"
                    });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Nem sikerült betölteni a felhasználókat: " + ex.Message,
                    "Hiba",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }


        // Az adatbázisban tárolt szerep (pl. "diak") megjelenítési formája (pl. "Diák")
        private static string FormatRole(string? role)
        {
            return role?.Trim().ToLowerInvariant() switch
            {
                "diak" => "Diák",
                "tanar" => "Tanár",
                "admin" => "Admin",
                null or "" => "-",
                var other => char.ToUpper(other[0]) + other.Substring(1)
            };
        }

        private void LoadLocalTaskTypes()
        {
            try
            {
                _localTaskTypes.Clear();

                if (System.IO.File.Exists(LocalTypesPath))
                {
                    var list = JsonSerializer.Deserialize<List<string>>(System.IO.File.ReadAllText(LocalTypesPath));
                    if (list != null)
                    {
                        _localTaskTypes.AddRange(list);
                        return;
                    }
                }

                // Első indítás: példa-típusok
                _localTaskTypes.AddRange(new[]
                {
            "Egyszerű választás",
            "Többszörös választás",
            "Igaz/Hamis",
            "Párosítás",
            "Rövid választ igénylő",
            "Kifejtős",
            "Táblázatos"
        });
                SaveLocalTaskTypes();
            }
            catch
            {
                // sérült fájl esetén üres lista
            }
        }

        private void SaveLocalTaskTypes()
        {
            try
            {
                string? dir = System.IO.Path.GetDirectoryName(LocalTypesPath);
                if (dir != null) System.IO.Directory.CreateDirectory(dir);

                System.IO.File.WriteAllText(
                    LocalTypesPath,
                    JsonSerializer.Serialize(_localTaskTypes, new JsonSerializerOptions
                    {
                        WriteIndented = true,
                        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                    }));
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Nem sikerült elmenteni a feladattípusokat: " + ex.Message,
                    "Mentési hiba",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }

        private void DashboardButton_Click(object sender, RoutedEventArgs e)
        {
            PageTitleText.Text = "Áttekintés";
            PageSubtitleText.Text = "A Tudástér adminisztrációs rendszerének áttekintése.";

            ContentArea.Content = DashboardContent;

            ReviewCountText.Text = GetPendingDraftCount().ToString();
        }

        private void TasksButton_Click(object sender, RoutedEventArgs e)
        {
            ShowTaskTypesPage();
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




        private void ShowTaskTypesPage()
        {
            PageTitleText.Text = "Feladattípusok";
            PageSubtitleText.Text = "A feladattípusok kezelése: keresés, hozzáadás és törlés.";

            var mainPanel = new StackPanel { Margin = new Thickness(0, 0, 20, 0) };

            // Felső sáv: bal oldalt kereső, jobb oldalt új típus felvitele
            var toolbar = new Grid { Margin = new Thickness(0, 0, 0, 20) };
            toolbar.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            toolbar.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            // --- Kereső (bal) ---
            var searchBox = new TextBox
            {
                Height = 42,
                FontSize = 14,
                Padding = new Thickness(12, 0, 12, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            // A lista létrehozása – kerüljön ide!
            var listPanel = new StackPanel();

            var searchPlaceholder = new TextBlock
            {
                Text = "Keresés...",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(14, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                IsHitTestVisible = false
            };

            searchBox.TextChanged += (s, e) =>
            {
                searchPlaceholder.Visibility =
                    string.IsNullOrEmpty(searchBox.Text)
                        ? Visibility.Visible
                        : Visibility.Collapsed;

                RefreshList();
            };

            var searchHost = new Grid();
            searchHost.Children.Add(searchBox);
            searchHost.Children.Add(searchPlaceholder);

            var searchBorder = new Border
            {
                Height = 42,
                Width = 320,
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                HorizontalAlignment = HorizontalAlignment.Left,
                Child = searchHost
            };
            Grid.SetColumn(searchBorder, 0);
            toolbar.Children.Add(searchBorder);

            // --- Új típus felvitele (jobb) ---
            var input = new TextBox
            {
                Width = 230,
                FontSize = 14,
                Padding = new Thickness(10, 0, 10, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            var placeholder = new TextBlock
            {
                Text = "Új típus neve...",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(12, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                IsHitTestVisible = false
            };

            var inputHost = new Grid();
            inputHost.Children.Add(input);
            inputHost.Children.Add(placeholder);

            input.TextChanged += (s, e) =>
            {
                placeholder.Visibility = string.IsNullOrEmpty(input.Text)
                    ? Visibility.Visible
                    : Visibility.Collapsed;
            };

            var addButton = new Button
            {
                Content = "+  HOZZÁADÁS",
                Width = 132,
                Template = UiStyles.Button,
                Background = (Brush)FindResource("PrimaryBrush"),
                Foreground = (Brush)FindResource("WhiteBrush"),
                BorderThickness = new Thickness(0),
                FontWeight = FontWeights.SemiBold,
                FontSize = 13,
                Cursor = Cursors.Hand
            };

            var addInner = new StackPanel { Orientation = Orientation.Horizontal };
            addInner.Children.Add(inputHost);
            addInner.Children.Add(addButton);

            var addBorder = new Border
            {
                Height = 42,
                Padding = new Thickness(0),
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("PrimaryBrush"),
                BorderThickness = new Thickness(1.5),
                CornerRadius = new CornerRadius(10),
                HorizontalAlignment = HorizontalAlignment.Right,
                Child = addInner
            };
            Grid.SetColumn(addBorder, 1);
            toolbar.Children.Add(addBorder);


            void RefreshList()
            {
                listPanel.Children.Clear();

                string filter = searchBox.Text.Trim();

                var visible = _localTaskTypes
                    .Where(t => filter.Length == 0 ||
                                t.Contains(filter, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                foreach (string typeName in visible)
                {
                    var card = new Border
                    {
                        Background = Brushes.White,
                        CornerRadius = new CornerRadius(12),
                        Padding = new Thickness(20),
                        Margin = new Thickness(0, 0, 0, 12)
                    };

                    var row = new Grid();
                    row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                    row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

                    var nameText = new TextBlock
                    {
                        Text = typeName,
                        FontSize = 18,
                        FontWeight = FontWeights.SemiBold,
                        VerticalAlignment = VerticalAlignment.Center,
                        Foreground = (Brush)FindResource("TextBrush")
                    };
                    Grid.SetColumn(nameText, 0);
                    row.Children.Add(nameText);

                    var deleteBtn = UiKit.DeleteButton();
                    string captured = typeName;
                    deleteBtn.Click += (s, e) =>
                    {
                        var answer = MessageBox.Show(
                            $"Biztosan törölni szeretnéd ezt a típust?\n\n{captured}",
                            "Típus törlése",
                            MessageBoxButton.YesNo,
                            MessageBoxImage.Question);

                        if (answer == MessageBoxResult.Yes)
                        {
                            _localTaskTypes.Remove(captured);
                            SaveLocalTaskTypes();
                            RefreshList();
                        }
                    };
                    Grid.SetColumn(deleteBtn, 1);
                    row.Children.Add(deleteBtn);

                    card.Child = row;
                    listPanel.Children.Add(card);
                }

                if (visible.Count == 0)
                {
                    listPanel.Children.Add(new TextBlock
                    {
                        Text = filter.Length == 0
                            ? "Még nincs feladattípus."
                            : "Nincs találat a keresésre.",
                        Foreground = (Brush)FindResource("MutedTextBrush")
                    });
                }
            }

            void AddType()
            {
                string name = input.Text.Trim();
                if (string.IsNullOrWhiteSpace(name))
                    return;

                if (_localTaskTypes.Any(t => t.Equals(name, StringComparison.OrdinalIgnoreCase)))
                {
                    MessageBox.Show("Ilyen nevű feladattípus már létezik.", "Már létezik",
                        MessageBoxButton.OK, MessageBoxImage.Warning);
                    return;
                }

                _localTaskTypes.Add(name);
                SaveLocalTaskTypes();
                input.Clear();
                searchBox.Clear();   // hogy az új elem biztosan látszódjon
                RefreshList();
            }

            searchBox.TextChanged += (s, e) => RefreshList();
            addButton.Click += (s, e) => AddType();
            input.KeyDown += (s, e) =>
            {
                if (e.Key == Key.Enter)
                {
                    AddType();
                    e.Handled = true;
                }
            };

            mainPanel.Children.Add(toolbar);
            mainPanel.Children.Add(listPanel);

            RefreshList();

            ContentArea.Content = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = mainPanel
            };
        }

        private void ShowSubjectsPage()
        {
            PageTitleText.Text = "Tantárgyak";
            PageSubtitleText.Text = "A Tudástér tantárgyainak kezelése: keresés, hozzáadás és törlés.";

            var mainPanel = new StackPanel { Margin = new Thickness(0, 0, 20, 0) };

            var toolbar = new Grid { Margin = new Thickness(0, 0, 0, 20) };
            toolbar.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            toolbar.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            // --- Kereső (bal) ---
            var searchBox = new TextBox
            {
                Height = 42,
                FontSize = 14,
                Padding = new Thickness(12, 0, 12, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            var searchPlaceholder = new TextBlock
            {
                Text = "Keresés...",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(14, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                IsHitTestVisible = false
            };

            searchBox.TextChanged += (s, e) =>
            {
                searchPlaceholder.Visibility = string.IsNullOrEmpty(searchBox.Text)
                    ? Visibility.Visible
                    : Visibility.Collapsed;
            };

            var searchHost = new Grid();
            searchHost.Children.Add(searchBox);
            searchHost.Children.Add(searchPlaceholder);

            var searchBorder = new Border
            {
                Height = 42,
                Width = 320,
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                HorizontalAlignment = HorizontalAlignment.Left,
                Child = searchHost
            };
            Grid.SetColumn(searchBorder, 0);
            toolbar.Children.Add(searchBorder);

            // --- Új tantárgy felvitele (jobb) ---
            var input = new TextBox
            {
                Width = 230,
                FontSize = 14,
                Padding = new Thickness(10, 0, 10, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            var placeholder = new TextBlock
            {
                Text = "Új tantárgy neve...",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(12, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                IsHitTestVisible = false
            };

            var inputHost = new Grid();
            inputHost.Children.Add(input);
            inputHost.Children.Add(placeholder);

            input.TextChanged += (s, e) =>
            {
                placeholder.Visibility = string.IsNullOrEmpty(input.Text)
                    ? Visibility.Visible
                    : Visibility.Collapsed;
            };

            var addButton = new Button
            {
                Content = "+  HOZZÁADÁS",
                Width = 132,
                Template = UiStyles.Button,
                Background = (Brush)FindResource("PrimaryBrush"),
                Foreground = (Brush)FindResource("WhiteBrush"),
                BorderThickness = new Thickness(0),
                FontWeight = FontWeights.SemiBold,
                FontSize = 13,
                Cursor = Cursors.Hand
            };

            var addInner = new StackPanel { Orientation = Orientation.Horizontal };
            addInner.Children.Add(inputHost);
            addInner.Children.Add(addButton);

            var addBorder = new Border
            {
                Height = 42,
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("PrimaryBrush"),
                BorderThickness = new Thickness(1.5),
                CornerRadius = new CornerRadius(10),
                HorizontalAlignment = HorizontalAlignment.Right,
                Child = addInner
            };
            Grid.SetColumn(addBorder, 1);
            toolbar.Children.Add(addBorder);

            // --- Lista ---
            var listPanel = new StackPanel();

            void RefreshList()
            {
                listPanel.Children.Clear();

                string filter = searchBox.Text.Trim();
                int shown = 0;

                void AddCard(string name, string detail, Brush detailBrush, Action onDelete, string confirmText)
                {
                    var card = new Border
                    {
                        Background = Brushes.White,
                        CornerRadius = new CornerRadius(12),
                        Padding = new Thickness(20),
                        Margin = new Thickness(0, 0, 0, 12)
                    };

                    var row = new Grid();
                    row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                    row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

                    var info = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
                    info.Children.Add(new TextBlock
                    {
                        Text = name,
                        FontSize = 18,
                        FontWeight = FontWeights.SemiBold,
                        Foreground = (Brush)FindResource("TextBrush")
                    });
                    info.Children.Add(new TextBlock
                    {
                        Text = detail,
                        FontSize = 14,
                        Foreground = detailBrush,
                        Margin = new Thickness(0, 5, 0, 0)
                    });
                    Grid.SetColumn(info, 0);
                    row.Children.Add(info);

                    var deleteBtn = UiKit.DeleteButton();
                    deleteBtn.VerticalAlignment = VerticalAlignment.Center;
                    deleteBtn.Click += (s, e) =>
                    {
                        var answer = MessageBox.Show(
                            confirmText,
                            "Tantárgy törlése",
                            MessageBoxButton.YesNo,
                            MessageBoxImage.Question);

                        if (answer == MessageBoxResult.Yes)
                        {
                            onDelete();
                            SaveLocalSubjects();
                            RefreshList();
                        }
                    };
                    Grid.SetColumn(deleteBtn, 1);
                    row.Children.Add(deleteBtn);

                    card.Child = row;
                    listPanel.Children.Add(card);
                    shown++;
                }

                // Helyben felvett tantárgyak
                foreach (string local in _localSubjects.ToList())
                {
                    if (filter.Length > 0 && !local.Contains(filter, StringComparison.OrdinalIgnoreCase))
                        continue;

                    string captured = local;
                    AddCard(
                        local,
                        "⚠ Helyi, még nincs feltöltve",
                        Brushes.DarkOrange,
                        () => _localSubjects.Remove(captured),
                        $"Biztosan törölni szeretnéd ezt a tantárgyat?\n\n{local}");
                }

                // Adatbázisból érkező tantárgyak (a törlés csak elrejti őket helyben)
                foreach (var subject in _subjects.ToList())
                {
                    if (_hiddenSubjectIds.Contains(subject.Id)) continue;
                    if (filter.Length > 0 && !subject.Name.Contains(filter, StringComparison.OrdinalIgnoreCase))
                        continue;

                    int id = subject.Id;
                    AddCard(
                        subject.Name,
                        $"{subject.TaskCount} feladat",
                        (Brush)FindResource("MutedTextBrush"),
                        () => _hiddenSubjectIds.Add(id),
                        $"Biztosan törölni szeretnéd ezt a tantárgyat?\n\n{subject.Name}\n\n" +
                        "Az adatbázisból egyelőre nem törlődik, csak eltűnik a listából ebben az alkalmazásban.");
                }

                if (shown == 0)
                {
                    listPanel.Children.Add(new TextBlock
                    {
                        Text = filter.Length == 0
                            ? "Még nincs tantárgy."
                            : "Nincs találat a keresésre.",
                        Foreground = (Brush)FindResource("MutedTextBrush")
                    });
                }
            }

            void AddSubject()
            {
                string name = input.Text.Trim();
                if (string.IsNullOrWhiteSpace(name))
                    return;

                bool exists =
                    _localSubjects.Any(s => s.Equals(name, StringComparison.OrdinalIgnoreCase)) ||
                    _subjects.Any(s => !_hiddenSubjectIds.Contains(s.Id) &&
                                       s.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

                if (exists)
                {
                    MessageBox.Show("Ilyen nevű tantárgy már létezik.", "Már létezik",
                        MessageBoxButton.OK, MessageBoxImage.Warning);
                    return;
                }

                _localSubjects.Add(name);
                SaveLocalSubjects();
                input.Clear();
                searchBox.Clear();   // hogy az új elem biztosan látszódjon
                RefreshList();
            }

            searchBox.TextChanged += (s, e) => RefreshList();
            addButton.Click += (s, e) => AddSubject();
            input.KeyDown += (s, e) =>
            {
                if (e.Key == Key.Enter)
                {
                    AddSubject();
                    e.Handled = true;
                }
            };

            // Ha az adatbázisos tantárgyak az oldal megnyitása után érkeznek meg, frissítünk
            System.Collections.Specialized.NotifyCollectionChangedEventHandler subjectsChanged =
                (s, e) => RefreshList();
            _subjects.CollectionChanged += subjectsChanged;

            mainPanel.Children.Add(toolbar);
            mainPanel.Children.Add(listPanel);

            RefreshList();

            var scrollViewer = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = mainPanel
            };
            scrollViewer.Unloaded += (s, e) => _subjects.CollectionChanged -= subjectsChanged;

            ContentArea.Content = scrollViewer;
        }

        private void ShowSettingsPage()
        {
            PageTitleText.Text = "Alkalmazás névjegye";
            PageSubtitleText.Text = "A Tudástér adminisztrációs alkalmazás szoftverének névjegye.";

            var mainPanel = new StackPanel();
            

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
            var saveButton = UiKit.Button("BEÁLLÍTÁSOK MENTÉSE", BtnKind.Primary, 220);
            saveButton.HorizontalAlignment = HorizontalAlignment.Left;
            saveButton.Margin = new Thickness(0, 5, 0, 20);

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
            PageSubtitleText.Text =
                "PDF-ek beolvasása és a feladatok előkészítése.";

            var mainPanel = new StackPanel();

            var fileNameText = new TextBlock
            {
                Text = "Nincs kiválasztott fájl.",
                TextWrapping = TextWrapping.Wrap,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(0, 0, 0, 15)
            };

            var selectButton = UiKit.Button("PDF KIVÁLASZTÁSA", BtnKind.Primary, 190);
            selectButton.HorizontalAlignment = HorizontalAlignment.Left;
            selectButton.Margin = new Thickness(0, 0, 0, 12);

            var processButton = UiKit.Button("PDF FELDOLGOZÁSA", BtnKind.Primary, 210);
            processButton.IsEnabled = false;
            processButton.HorizontalAlignment = HorizontalAlignment.Left;
            processButton.Margin = new Thickness(0, 0, 0, 20);

            var resultTitle = new TextBlock
            {
                Text = "Felismert feladatok",
                FontSize = 20,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 0, 0, 12)
            };

            var resultPanel = new StackPanel();
            var draftPanel = new StackPanel();

            // Betöltésjelző
            var loadingPanel = new StackPanel
            {
                Visibility = Visibility.Collapsed,
                Margin = new Thickness(0, 0, 0, 16)
            };

            loadingPanel.Children.Add(new TextBlock
            {
                Text = "A PDF feldolgozása folyamatban...",
                FontSize = 14,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("PrimaryBrush"),
                Margin = new Thickness(0, 0, 0, 10)
            });

            loadingPanel.Children.Add(new ProgressBar
            {
                Width = 320,
                Height = 8,
                IsIndeterminate = true,
                Foreground = (Brush)FindResource("PrimaryBrush"),
                Background = new SolidColorBrush(
                    (Color)ColorConverter.ConvertFromString("#EAE2F5")),
                HorizontalAlignment = HorizontalAlignment.Left
            });

            string? selectedFilePath = null;

            selectButton.Click += (sender, e) =>
            {
                var dialog = new Microsoft.Win32.OpenFileDialog
                {
                    Title = "Érettségi PDF kiválasztása",
                    Filter = "PDF dokumentumok (*.pdf)|*.pdf|Minden fájl (*.*)|*.*",
                    CheckFileExists = true,
                    Multiselect = false
                };

                if (dialog.ShowDialog() == true)
                {
                    selectedFilePath = dialog.FileName;
                    fileNameText.Text = selectedFilePath;
                    resultPanel.Children.Clear();
                    processButton.IsEnabled = true;
                }
            };


            processButton.Click += async (sender, e) =>
            {
                if (string.IsNullOrWhiteSpace(selectedFilePath))
                {
                    MessageBox.Show("Először válassz ki egy PDF-fájlt!");
                    return;
                }

                processButton.IsEnabled = false;
                selectButton.IsEnabled = false;

                resultPanel.Children.Clear();

                loadingPanel.Visibility = Visibility.Visible;
                resultPanel.Children.Add(loadingPanel);

                try
                {
                    // 1) A PDF szövege: már csak a forrásszövegek ellenőrzéséhez kell
                    var extractor = new PdfTextExtractor();

                    string pdfPath = selectedFilePath;

                    List<PdfPageContent> pages = await Task.Run(
                        () => extractor.ExtractPages(pdfPath));
                    

                    var textBuilder = new System.Text.StringBuilder();
                    foreach (var page in pages)
                    {
                        if (string.IsNullOrWhiteSpace(page.Text))
                            continue;

                        textBuilder.AppendLine();
                        textBuilder.AppendLine($"[[PDF_OLDAL_{page.PageNumber}]]");
                        textBuilder.AppendLine(page.Text.Trim());
                        textBuilder.AppendLine();
                    }
                    string extractedText = textBuilder.ToString();

                    // 2) Gemini
                    byte[] pdfBytes = await System.IO.File.ReadAllBytesAsync(pdfPath);
                    var topics = _topics.Select(t => new TopicInfo(t.Id, t.Name, t.Subject)).ToList();

                    var ai = new GeminiService();
                    AiExamDto exam = await ai.ParseExamAsync(pdfBytes, topics);

                    // Hibakereséshez: a nyers eredmény a %TEMP% mappában
                    System.IO.File.WriteAllText(
                        System.IO.Path.Combine(System.IO.Path.GetTempPath(), "exam.json"),
                        JsonSerializer.Serialize(exam, new JsonSerializerOptions
                        {
                            WriteIndented = true,
                            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                        }));

                    DraftExam draft = AiExamMapper.ToDraft(
    exam, System.IO.Path.GetFileName(pdfPath), extractedText, topics);

                    // 4) Mentés HELYBEN (az adatbázishoz még nem nyúlunk)
                    DraftStore.SavePdfCopy(draft, pdfPath);
                    DraftStore.Save(draft);
                    RefreshDraftList(draftPanel);

                    resultPanel.Children.Clear();

                    resultPanel.Children.Add(new TextBlock
                    {
                        Text = $"Kész: {draft.Tasks.Count} feladat felismerve, a piszkozat elmentve.",
                        FontSize = 18,
                        FontWeight = FontWeights.SemiBold,
                        Foreground = (Brush)FindResource("PrimaryBrush"),
                        Margin = new Thickness(0, 0, 0, 6)
                    });

                    resultPanel.Children.Add(new TextBlock
                    {
                        Text = draft.Title,
                        FontSize = 13,
                        Foreground = (Brush)FindResource("MutedTextBrush"),
                        Margin = new Thickness(0, 0, 0, 10)
                    });

                    foreach (string warning in draft.Warnings)
                    {
                        resultPanel.Children.Add(new TextBlock
                        {
                            Text = "⚠ " + warning,
                            FontSize = 13,
                            TextWrapping = TextWrapping.Wrap,
                            Foreground = Brushes.DarkOrange,
                            Margin = new Thickness(0, 0, 0, 6)
                        });
                    }

                    var openButton = UiKit.Button("MEGNYITÁS A SZERKESZTŐBEN", BtnKind.Primary, 250);
                    openButton.HorizontalAlignment = HorizontalAlignment.Left;
                    openButton.Margin = new Thickness(0, 8, 0, 0);
                    openButton.Click += (s2, e2) =>
                    {
                        OpenDraftEditor(draft.Id);
                        RefreshDraftList(draftPanel);
                    };
                    resultPanel.Children.Add(openButton);
                }
                catch (Exception ex)
                {
                    resultPanel.Children.Clear();
                    MessageBox.Show(
                        $"Hiba a PDF feldolgozásakor:\n{ex.Message}",
                        "PDF-feldolgozási hiba",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error);
                }
                finally
                {
                    loadingPanel.Visibility = Visibility.Collapsed;

                    processButton.IsEnabled = true;
                    selectButton.IsEnabled = true;
                }
            };


            mainPanel.Children.Add(new TextBlock
            {
                Text = "Válassz ki egy érettségi PDF-et.",
                FontSize = 16,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 0, 0, 12)
            });

            mainPanel.Children.Add(fileNameText);
            mainPanel.Children.Add(selectButton);
            mainPanel.Children.Add(processButton);
            mainPanel.Children.Add(resultTitle);
            mainPanel.Children.Add(resultPanel);

            mainPanel.Children.Add(new TextBlock
            {
                Text = "Mentett piszkozatok",
                FontSize = 20,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("TextBrush"),
                Margin = new Thickness(0, 30, 0, 12)
            });
            mainPanel.Children.Add(draftPanel);
            RefreshDraftList(draftPanel);

            ContentArea.Content = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = mainPanel
            };
        }

        private void RefreshDraftList(StackPanel target)
        {
            target.Children.Clear();

            var drafts = DraftStore.List();
            if (drafts.Count == 0)
            {
                target.Children.Add(new TextBlock
                {
                    Text = "Még nincs mentett piszkozat.",
                    Foreground = (Brush)FindResource("MutedTextBrush")
                });
                return;
            }

            foreach (var d in drafts)
            {
                var card = new Border
                {
                    Background = Brushes.White,
                    BorderBrush = (Brush)FindResource("BorderBrush"),
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(12),
                    Padding = new Thickness(18),
                    Margin = new Thickness(0, 0, 0, 12)
                };

                var row = new Grid();
                row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

                var info = new StackPanel();
                info.Children.Add(new TextBlock
                {
                    Text = d.Title,
                    FontSize = 16,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = (Brush)FindResource("TextBrush")
                });
                info.Children.Add(new TextBlock
                {
                    Text = $"{d.TaskCount} feladat • {d.ApprovedCount} jóváhagyva • módosítva: {d.UpdatedUtc.ToLocalTime():yyyy.MM.dd HH:mm}",
                    FontSize = 13,
                    Foreground = (Brush)FindResource("MutedTextBrush"),
                    Margin = new Thickness(0, 4, 0, 0)
                });
                Grid.SetColumn(info, 0);
                row.Children.Add(info);
                var full = DraftStore.Load(d.Id);
                int total = full?.Tasks.Count ?? d.TaskCount;
                var without = full?.Tasks.Where(t => !DraftValidator.HasSolution(t)).ToList()
                              ?? new List<DraftTask>();
                int withKey = total - without.Count;

                string keyText;
                Brush keyBrush;
                if (without.Count == 0)
                {
                    keyText = $"✓ Megoldókulcs: mind a {total} feladathoz van";
                    keyBrush = Brushes.Green;
                }
                else if (withKey == 0)
                {
                    keyText = "⚠ Megoldókulcs: még nincs importálva";
                    keyBrush = Brushes.DarkOrange;
                }
                else
                {
                    string list = string.Join(", ", without.Take(10).Select(t => t.DisplayNumber.TrimEnd('.')));
                    if (without.Count > 10) list += $" … (+{without.Count - 10})";
                    keyText = $"⚠ Megoldókulcs: {withKey}/{total} feladathoz van. Hiányzik: {list}";
                    keyBrush = Brushes.DarkOrange;
                }

                info.Children.Add(new TextBlock
                {
                    Text = keyText,
                    FontSize = 13,
                    FontWeight = FontWeights.SemiBold,
                    TextWrapping = TextWrapping.Wrap,
                    Foreground = keyBrush,
                    Margin = new Thickness(0, 4, 0, 0)
                });

                var openBtn = UiKit.Button("MEGNYITÁS", BtnKind.Primary, 120, 38);
                openBtn.Margin = new Thickness(0, 0, 8, 0);
                var deleteBtn = UiKit.DeleteButton();
                deleteBtn.VerticalAlignment = VerticalAlignment.Center;

                openBtn.Click += (s, e) =>
                {
                    OpenDraftEditor(d.Id);
                    RefreshDraftList(target);
                };

                deleteBtn.Click += (s, e) =>
                {
                    var answer = MessageBox.Show(
                        $"Biztosan törölni szeretnéd a piszkozatot?\n\n{d.Title}\n\nA hozzá tartozó képek is törlődnek.",
                        "Piszkozat törlése",
                        MessageBoxButton.YesNo,
                        MessageBoxImage.Question);

                    if (answer == MessageBoxResult.Yes)
                    {
                        DraftStore.Delete(d.Id);
                        RefreshDraftList(target);
                    }
                };

                var buttons = new StackPanel { Orientation = Orientation.Horizontal };
                buttons.Children.Add(openBtn);
                buttons.Children.Add(deleteBtn);
                Grid.SetColumn(buttons, 1);
                row.Children.Add(buttons);

                card.Child = row;
                target.Children.Add(card);
            }
        }

        private void OpenDraftEditor(string draftId)
        {
            var draft = DraftStore.Load(draftId);
            if (draft == null)
            {
                MessageBox.Show("A piszkozat nem tölthető be.", "Hiba");
                return;
            }

            var topics = _topics.Select(t => new TopicInfo(t.Id, t.Name, t.Subject)).ToList();
            var subjects = _subjects.Select(s => s.Name).ToList();

            var window = new DraftEditorWindow(draft, topics, subjects) { Owner = this };
            window.ShowDialog();
        }


        private void ShowTopicsPage()
        {
            PageTitleText.Text = "Témakörök";
            PageSubtitleText.Text = "A Tudástér témaköreinek áttekintése, hozzáadás és törlés.";

            var mainPanel = new StackPanel { Margin = new Thickness(0, 0, 20, 0) };

            // --- Segédfüggvények ---
            Brush Hex(string hex) => (Brush)new BrushConverter().ConvertFromString(hex)!;

            // Kis-nagybetű és ékezet nélküli összehasonlításhoz
            string Fold(string text)
            {
                string decomposed = (text ?? "").Normalize(NormalizationForm.FormD);
                var sb = new StringBuilder();
                foreach (char c in decomposed)
                {
                    if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c)
                        != System.Globalization.UnicodeCategory.NonSpacingMark)
                    {
                        sb.Append(c);
                    }
                }
                return sb.ToString().ToLowerInvariant();
            }

            // --- Tantárgy színek ---
            var knownColors = new Dictionary<string, (string Bg, string Fg)>(StringComparer.OrdinalIgnoreCase)
            {
                ["Történelem"] = ("#FFF4D6", "#9A6700"),
                ["Irodalom"] = ("#F1E8FD", "#6B2FB3"),
                ["Magyar nyelv"] = ("#E6F6EC", "#177245"),
                ["Matematika"] = ("#E8F0FE", "#1A56DB")
            };

            var palette = new[]
            {
        ("#FDE8E8", "#C81E1E"),
        ("#E0F5F5", "#0E7C86"),
        ("#FDEBDD", "#B54708"),
        ("#E8EAF6", "#3949AB"),
        ("#EAF4E0", "#4C7A1E")
    };

            (Brush Bg, Brush Fg) SubjectColors(string subject)
            {
                if (knownColors.TryGetValue(subject, out var c))
                    return (Hex(c.Bg), Hex(c.Fg));

                int hash = subject.Aggregate(0, (acc, ch) => acc + ch);
                var p = palette[hash % palette.Length];
                return (Hex(p.Item1), Hex(p.Item2));
            }

            // --- Felső sáv: bal oldalt kereső, jobb oldalt új témakör felvitele ---
            var toolbar = new Grid { Margin = new Thickness(0, 0, 0, 12) };
            toolbar.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            toolbar.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            // --- Kereső (bal) ---
            var searchBox = new TextBox
            {
                Height = 42,
                FontSize = 14,
                Padding = new Thickness(12, 0, 12, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            var searchPlaceholder = new TextBlock
            {
                Text = "Keresés...",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(14, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                IsHitTestVisible = false
            };

            searchBox.TextChanged += (s, e) =>
            {
                searchPlaceholder.Visibility = string.IsNullOrEmpty(searchBox.Text)
                    ? Visibility.Visible
                    : Visibility.Collapsed;
            };

            var searchHost = new Grid();
            searchHost.Children.Add(searchBox);
            searchHost.Children.Add(searchPlaceholder);

            var searchBorder = new Border
            {
                Height = 42,
                Width = 320,
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                HorizontalAlignment = HorizontalAlignment.Left,
                VerticalAlignment = VerticalAlignment.Top,
                Child = searchHost
            };
            Grid.SetColumn(searchBorder, 0);
            toolbar.Children.Add(searchBorder);

            // --- Új témakör felvitele (jobb) ---
            var nameInput = new TextBox
            {
                Width = 230,
                FontSize = 14,
                Padding = new Thickness(10, 0, 10, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            var namePlaceholder = new TextBlock
            {
                Text = "Előbb válassz tantárgyat...",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(12, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                IsHitTestVisible = false
            };

            nameInput.TextChanged += (s, e) =>
            {
                namePlaceholder.Visibility = string.IsNullOrEmpty(nameInput.Text)
                    ? Visibility.Visible
                    : Visibility.Collapsed;
            };

            var nameHost = new Grid();
            nameHost.Children.Add(nameInput);
            nameHost.Children.Add(namePlaceholder);

            var addButton = new Button
            {
                Content = "+  HOZZÁADÁS",
                Width = 132,
                Template = UiStyles.Button,
                Background = (Brush)FindResource("PrimaryBrush"),
                Foreground = (Brush)FindResource("WhiteBrush"),
                BorderThickness = new Thickness(0),
                FontWeight = FontWeights.SemiBold,
                FontSize = 13,
                Cursor = Cursors.Hand
            };

            var addInner = new StackPanel { Orientation = Orientation.Horizontal };
            addInner.Children.Add(nameHost);
            addInner.Children.Add(addButton);

            var addBorder = new Border
            {
                Height = 42,
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("PrimaryBrush"),
                BorderThickness = new Thickness(1.5),
                CornerRadius = new CornerRadius(10),
                HorizontalAlignment = HorizontalAlignment.Right,
                Child = addInner
            };

            // --- Tantárgy-választó kapszulák (a hozzáadás doboz alatt, jobbra) ---
            string? selectedSubject = null;

            var chipPanel = new WrapPanel();

            void UpdateAddState()
            {
                bool hasSubject = selectedSubject != null;

                addButton.IsEnabled = hasSubject;
                addButton.Background = hasSubject
                    ? (Brush)FindResource("PrimaryBrush")
                    : Hex("#B8C2CC");
                addButton.Cursor = hasSubject ? Cursors.Hand : Cursors.Arrow;
                addBorder.BorderBrush = hasSubject
                    ? (Brush)FindResource("PrimaryBrush")
                    : (Brush)FindResource("BorderBrush");

                namePlaceholder.Text = hasSubject
                    ? "Új témakör neve..."
                    : "Előbb válassz tantárgyat...";
            }

            List<string> GetSubjectNames()
            {
                var names = _subjects.Where(s => !_hiddenSubjectIds.Contains(s.Id)).Select(s => s.Name)
                            .Concat(_localSubjects)
                            .Concat(_topics.Select(t => t.Subject))
                            .Concat(_localTopics.Select(t => t.Subject))
                            .Where(n => !string.IsNullOrWhiteSpace(n) && n != "Nincs tantárgy")
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                            .OrderBy(n => n)
                            .ToList();

                if (names.Count == 0)
                    names = new List<string> { "Irodalom", "Magyar nyelv", "Matematika", "Történelem" };

                return names;
            }

            void RebuildChips()
            {
                chipPanel.Children.Clear();

                var names = GetSubjectNames();

                // Ha a kiválasztott tantárgy már nem létezik, a kijelölés megszűnik
                if (selectedSubject != null &&
                    !names.Contains(selectedSubject, StringComparer.OrdinalIgnoreCase))
                {
                    selectedSubject = null;
                }

                foreach (string name in names)
                {
                    string captured = name;
                    bool selected = selectedSubject != null &&
                                    name.Equals(selectedSubject, StringComparison.OrdinalIgnoreCase);
                    var colors = SubjectColors(name);

                    var label = new TextBlock
                    {
                        Text = selected ? "✓  " + name : name,
                        FontSize = 13,
                        FontWeight = FontWeights.SemiBold,
                        Foreground = selected ? colors.Fg : (Brush)FindResource("MutedTextBrush")
                    };

                    var chip = new Border
                    {
                        Padding = new Thickness(14, 6, 14, 6),
                        Margin = new Thickness(8, 0, 0, 8),
                        CornerRadius = new CornerRadius(16),
                        BorderThickness = new Thickness(1.5),
                        Background = selected ? colors.Bg : Brushes.White,
                        BorderBrush = selected ? colors.Fg : (Brush)FindResource("BorderBrush"),
                        Cursor = Cursors.Hand,
                        Child = label
                    };

                    chip.MouseLeftButtonUp += (s, e) =>
                    {
                        // Ugyanarra újra kattintva a kijelölés megszűnik
                        selectedSubject = (selectedSubject != null &&
                                           selectedSubject.Equals(captured, StringComparison.OrdinalIgnoreCase))
                            ? null
                            : captured;

                        RebuildChips();
                    };

                    chipPanel.Children.Add(chip);
                }

                UpdateAddState();
            }

            var chipLabel = new TextBlock
            {
                Text = "Tantárgy az új témakörhöz",
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                HorizontalAlignment = HorizontalAlignment.Right,
                Margin = new Thickness(0, 10, 2, 8)
            };

            var chipSection = new StackPanel
            {
                HorizontalAlignment = HorizontalAlignment.Right,
                MaxWidth = 560
            };
            chipSection.Children.Add(chipLabel);
            chipSection.Children.Add(chipPanel);

            // Jobb oszlop: hozzáadás doboz + kapszulák egymás alatt
            var rightColumn = new StackPanel { HorizontalAlignment = HorizontalAlignment.Right };
            rightColumn.Children.Add(addBorder);
            rightColumn.Children.Add(chipSection);
            Grid.SetColumn(rightColumn, 1);
            toolbar.Children.Add(rightColumn);

            // --- Lista ---
            var listPanel = new StackPanel { Margin = new Thickness(0, 8, 0, 0) };

            void RefreshList()
            {
                listPanel.Children.Clear();

                string filter = Fold(searchBox.Text.Trim());

                bool Matches(string name, string subject) =>
                    filter.Length == 0 ||
                    Fold(name).Contains(filter) ||
                    Fold(subject).Contains(filter);

                int shown = 0;

                void AddCard(string name, string subject, string detail, Brush detailBrush, Action onDelete, string confirmText)
                {
                    var card = new Border
                    {
                        Background = Brushes.White,
                        CornerRadius = new CornerRadius(12),
                        Padding = new Thickness(20),
                        Margin = new Thickness(0, 0, 0, 12)
                    };

                    var row = new Grid();
                    row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                    row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

                    var info = new StackPanel();
                    info.Children.Add(new TextBlock
                    {
                        Text = name,
                        FontSize = 18,
                        FontWeight = FontWeights.SemiBold,
                        Foreground = (Brush)FindResource("TextBrush")
                    });

                    var colors = SubjectColors(subject);
                    var badge = new Border
                    {
                        Background = colors.Bg,
                        CornerRadius = new CornerRadius(8),
                        Padding = new Thickness(10, 3, 10, 3),
                        VerticalAlignment = VerticalAlignment.Center,
                        Child = new TextBlock
                        {
                            Text = subject,
                            FontSize = 12,
                            FontWeight = FontWeights.SemiBold,
                            Foreground = colors.Fg
                        }
                    };

                    var detailRow = new StackPanel
                    {
                        Orientation = Orientation.Horizontal,
                        Margin = new Thickness(0, 8, 0, 0)
                    };
                    detailRow.Children.Add(badge);
                    detailRow.Children.Add(new TextBlock
                    {
                        Text = detail,
                        FontSize = 13,
                        Foreground = detailBrush,
                        Margin = new Thickness(10, 0, 0, 0),
                        VerticalAlignment = VerticalAlignment.Center
                    });
                    info.Children.Add(detailRow);

                    Grid.SetColumn(info, 0);
                    row.Children.Add(info);

                    var deleteBtn = UiKit.DeleteButton();
                    deleteBtn.VerticalAlignment = VerticalAlignment.Center;
                    deleteBtn.Click += (s, e) =>
                    {
                        var answer = MessageBox.Show(
                            confirmText,
                            "Témakör törlése",
                            MessageBoxButton.YesNo,
                            MessageBoxImage.Question);

                        if (answer == MessageBoxResult.Yes)
                        {
                            onDelete();
                            SaveLocalTopics();
                            RefreshList();
                        }
                    };
                    Grid.SetColumn(deleteBtn, 1);
                    row.Children.Add(deleteBtn);

                    card.Child = row;
                    listPanel.Children.Add(card);
                    shown++;
                }

                // Helyben felvett témakörök
                foreach (var local in _localTopics.ToList())
                {
                    if (!Matches(local.Name, local.Subject)) continue;

                    var captured = local;
                    AddCard(
                        local.Name,
                        local.Subject,
                        "⚠ Helyi, még nincs feltöltve",
                        Brushes.DarkOrange,
                        () => _localTopics.Remove(captured),
                        $"Biztosan törölni szeretnéd ezt a témakört?\n\n{local.Name} ({local.Subject})");
                }

                // Adatbázisból érkező témakörök (a törlés csak elrejti őket helyben)
                foreach (var topic in _topics.ToList())
                {
                    if (_hiddenTopicIds.Contains(topic.Id)) continue;
                    if (!Matches(topic.Name, topic.Subject)) continue;

                    int id = topic.Id;
                    AddCard(
                        topic.Name,
                        topic.Subject,
                        $"{topic.TaskCount} feladat",
                        (Brush)FindResource("MutedTextBrush"),
                        () => _hiddenTopicIds.Add(id),
                        $"Biztosan törölni szeretnéd ezt a témakört?\n\n{topic.Name} ({topic.Subject})\n\n" +
                        "Az adatbázisból egyelőre nem törlődik, csak eltűnik a listából ebben az alkalmazásban.");
                }

                if (shown == 0)
                {
                    listPanel.Children.Add(new TextBlock
                    {
                        Text = searchBox.Text.Trim().Length == 0
                            ? "Még nincs témakör."
                            : "Nincs találat a keresésre.",
                        Foreground = (Brush)FindResource("MutedTextBrush")
                    });
                }
            }

            void AddTopic()
            {
                string name = nameInput.Text.Trim();
                string? subject = selectedSubject;

                // Tantárgy nélkül nem lehet hozzáadni
                if (string.IsNullOrWhiteSpace(subject))
                    return;

                if (string.IsNullOrWhiteSpace(name))
                    return;

                bool exists =
                    _localTopics.Any(t => t.Name.Equals(name, StringComparison.OrdinalIgnoreCase) &&
                                          t.Subject.Equals(subject, StringComparison.OrdinalIgnoreCase)) ||
                    _topics.Any(t => !_hiddenTopicIds.Contains(t.Id) &&
                                     t.Name.Equals(name, StringComparison.OrdinalIgnoreCase) &&
                                     t.Subject.Equals(subject, StringComparison.OrdinalIgnoreCase));

                if (exists)
                {
                    MessageBox.Show("Ilyen nevű témakör már létezik ennél a tantárgynál.", "Már létezik",
                        MessageBoxButton.OK, MessageBoxImage.Warning);
                    return;
                }

                _localTopics.Add(new LocalTopic { Name = name, Subject = subject });
                SaveLocalTopics();
                nameInput.Clear();
                searchBox.Clear();   // hogy az új elem biztosan látszódjon
                RefreshList();
            }

            searchBox.TextChanged += (s, e) => RefreshList();
            addButton.Click += (s, e) => AddTopic();
            nameInput.KeyDown += (s, e) =>
            {
                if (e.Key == Key.Enter)
                {
                    AddTopic();
                    e.Handled = true;
                }
            };

            // Ha az adatbázisos adatok az oldal megnyitása után érkeznek meg, frissítünk
            System.Collections.Specialized.NotifyCollectionChangedEventHandler topicsChanged =
                (s, e) =>
                {
                    RebuildChips();
                    RefreshList();
                };
            _topics.CollectionChanged += topicsChanged;

            mainPanel.Children.Add(toolbar);
            mainPanel.Children.Add(listPanel);

            RebuildChips();
            RefreshList();

            var scrollViewer = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = mainPanel
            };
            scrollViewer.Unloaded += (s, e) => _topics.CollectionChanged -= topicsChanged;

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

            // Keresőmező
            var searchBox = new TextBox
            {
                Height = 42,
                FontSize = 14,
                Padding = new Thickness(12, 0, 12, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };

            var searchPlaceholder = new TextBlock
            {
                Text = "Keresés...",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(14, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                IsHitTestVisible = false
            };

            searchBox.TextChanged += (s, e) =>
            {
                searchPlaceholder.Visibility =
                    string.IsNullOrEmpty(searchBox.Text)
                        ? Visibility.Visible
                        : Visibility.Collapsed;
            };

            searchBox.TextChanged += ExamSetSearchBox_TextChanged;

            _examSetSearchBox = searchBox;

            var searchHost = new Grid();
            searchHost.Children.Add(searchBox);
            searchHost.Children.Add(searchPlaceholder);

            var searchBorder = new Border
            {
                Height = 42,
                Width = 320,
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                HorizontalAlignment = HorizontalAlignment.Left,
                VerticalAlignment = VerticalAlignment.Top,
                Child = searchHost
            };

            Grid.SetColumn(searchBorder, 0);
            toolbar.Children.Add(searchBorder);

            // Táblázat
            _examSetGrid = new DataGrid
            {
                AutoGenerateColumns = false,
                IsReadOnly = true,
                HeadersVisibility = DataGridHeadersVisibility.Column,

                RowHeight = 58,
                FontSize = 13,

                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),

                GridLinesVisibility = DataGridGridLinesVisibility.Horizontal,
                HorizontalGridLinesBrush = (Brush)FindResource("BorderBrush"),
                VerticalGridLinesBrush = Brushes.Transparent,

                SelectionMode = DataGridSelectionMode.Single,
                SelectionUnit = DataGridSelectionUnit.FullRow,

                CanUserAddRows = false,
                CanUserResizeRows = false,
                CanUserReorderColumns = false,

                AlternationCount = 2,

                RowBackground = Brushes.White,
                AlternatingRowBackground =
                    new SolidColorBrush((Color)ColorConverter.ConvertFromString("#FAF9FC"))
            };

            // Fejléc stílusa
            _examSetGrid.ColumnHeaderStyle = new Style(typeof(DataGridColumnHeader))
            {
                Setters =
        {
            new Setter(Control.BackgroundProperty,
                new SolidColorBrush((Color)ColorConverter.ConvertFromString("#F4F2F8"))),

            new Setter(Control.ForegroundProperty,
                (Brush)FindResource("TextBrush")),

            new Setter(Control.FontWeightProperty, FontWeights.SemiBold),
            new Setter(Control.FontSizeProperty, 12.5),
            new Setter(Control.PaddingProperty, new Thickness(14, 14, 14, 14)),
            new Setter(Control.VerticalContentAlignmentProperty, VerticalAlignment.Center),
            new Setter(Control.HorizontalContentAlignmentProperty, HorizontalAlignment.Left),
            new Setter(Control.BorderThicknessProperty, new Thickness(0, 0, 0, 1)),
            new Setter(Control.BorderBrushProperty,
                (Brush)FindResource("BorderBrush"))
        }
            };

            // Cellák stílusa
            var cellStyle = new Style(typeof(DataGridCell));

            cellStyle.Setters.Add(
                new Setter(Control.PaddingProperty, new Thickness(14, 0, 14, 0)));

            cellStyle.Setters.Add(
                new Setter(Control.BorderThicknessProperty, new Thickness(0)));

            cellStyle.Setters.Add(
                new Setter(Control.VerticalContentAlignmentProperty, VerticalAlignment.Center));

            cellStyle.Setters.Add(
                new Setter(Control.HorizontalContentAlignmentProperty, HorizontalAlignment.Stretch));

            cellStyle.Setters.Add(
                new Setter(Control.ForegroundProperty, (Brush)FindResource("TextBrush")));

            // Kijelölt cella lila háttérrel
            cellStyle.Triggers.Add(new Trigger
            {
                Property = DataGridCell.IsSelectedProperty,
                Value = true,
                Setters =
    {
        new Setter(Control.BackgroundProperty,
            new SolidColorBrush(
                (Color)ColorConverter.ConvertFromString("#EAE2F5"))),

        new Setter(Control.ForegroundProperty,
            (Brush)FindResource("PrimaryBrush"))
    }
            });

            _examSetGrid.CellStyle = cellStyle;

            // Egységes szövegstílus
            var textStyle = new Style(typeof(TextBlock));

            textStyle.Setters.Add(
                new Setter(FrameworkElement.VerticalAlignmentProperty, VerticalAlignment.Center));

            textStyle.Setters.Add(
                new Setter(FrameworkElement.MarginProperty, new Thickness(0)));

            textStyle.Setters.Add(
                new Setter(TextBlock.TextTrimmingProperty, TextTrimming.CharacterEllipsis));

            // Középre igazított számok stílusa
            var centeredNumberStyle = new Style(typeof(TextBlock));

            centeredNumberStyle.Setters.Add(
                new Setter(TextBlock.VerticalAlignmentProperty, VerticalAlignment.Center));

            centeredNumberStyle.Setters.Add(
                new Setter(TextBlock.HorizontalAlignmentProperty, HorizontalAlignment.Stretch));

            centeredNumberStyle.Setters.Add(
                new Setter(TextBlock.TextAlignmentProperty, TextAlignment.Center));

            centeredNumberStyle.Setters.Add(
                new Setter(FrameworkElement.MarginProperty, new Thickness(0)));

            // Sorok stílusa
            var rowStyle = new Style(typeof(DataGridRow));

            rowStyle.Setters.Add(
                new Setter(Control.BorderThicknessProperty, new Thickness(0)));

            rowStyle.Setters.Add(
                new Setter(Control.CursorProperty, Cursors.Hand));

            rowStyle.Triggers.Add(new Trigger
            {
                Property = DataGridRow.IsMouseOverProperty,
                Value = true,
                Setters =
        {
            new Setter(Control.BackgroundProperty,
                new SolidColorBrush(
                    (Color)ColorConverter.ConvertFromString("#F1ECF8")))
        }
            });

            rowStyle.Triggers.Add(new Trigger
            {
                Property = DataGridRow.IsSelectedProperty,
                Value = true,
                Setters =
        {
            new Setter(Control.BackgroundProperty,
                new SolidColorBrush(
                    (Color)ColorConverter.ConvertFromString("#EAE2F5"))),

            new Setter(Control.ForegroundProperty,
                (Brush)FindResource("PrimaryBrush"))
        }
            });

            _examSetGrid.RowStyle = rowStyle;

            // ID - középre igazítva
            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "ID",
                Binding = new Binding("Id"),
                Width = 60,
                ElementStyle = centeredNumberStyle
            });

            // Év
            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Év",
                Binding = new Binding("Year"),
                Width = 70,
                ElementStyle = textStyle
            });

            // Tantárgy
            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Tantárgy",
                Binding = new Binding("Subject"),
                Width = 130,
                ElementStyle = textStyle
            });

            // Szint
            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Szint",
                Binding = new Binding("Level"),
                Width = 120,
                ElementStyle = textStyle
            });

            // Típus
            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Típus",
                Binding = new Binding("Type"),
                Width = 110,
                ElementStyle = textStyle
            });

            // Feladatsor
            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Feladatsor",
                Binding = new Binding("Title"),
                Width = new DataGridLength(1, DataGridLengthUnitType.Star),
                ElementStyle = textStyle
            });

            // Feladatok száma - középre igazítva
            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Feladatok",
                Binding = new Binding("TaskCount"),
                Width = 110,
                ElementStyle = centeredNumberStyle
            });

            // Állapot
            _examSetGrid.Columns.Add(new DataGridTextColumn
            {
                Header = "Állapot",
                Binding = new Binding("Status"),
                Width = 140,
                ElementStyle = textStyle
            });

            _examSetGrid.ItemsSource = _examSets;

            // Megjelenítés
            mainPanel.Children.Add(toolbar);
            mainPanel.Children.Add(_examSetGrid);

            ContentArea.Content = mainPanel;
        }




        private void ShowUsersPage()
        {
            PageTitleText.Text = "Felhasználók";
            PageSubtitleText.Text = "A Tudástér felhasználóinak kezelése: keresés, szerkesztés és törlés.";

            var mainPanel = new StackPanel
            {
                Margin = new Thickness(0, 0, 20, 0)
            };

            // Felső sáv
            var toolbar = new Grid
            {
                Margin = new Thickness(0, 0, 0, 20)
            };

            toolbar.ColumnDefinitions.Add(
                new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

            // Kereső
            var searchBox = new TextBox
            {
                Height = 42,
                FontSize = 14,
                Padding = new Thickness(12, 0, 12, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };
            var listPanel = new StackPanel();

            var searchPlaceholder = new TextBlock
            {
                Text = "Keresés...",
                FontSize = 14,
                Foreground = (Brush)FindResource("MutedTextBrush"),
                Margin = new Thickness(14, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                IsHitTestVisible = false
            };

            var searchHost = new Grid();
            searchHost.Children.Add(searchBox);
            searchHost.Children.Add(searchPlaceholder);

            searchBox.TextChanged += (s, e) =>
            {
                searchPlaceholder.Visibility =
                    string.IsNullOrEmpty(searchBox.Text)
                        ? Visibility.Visible
                        : Visibility.Collapsed;

                RefreshUsers();
            };

            var searchBorder = new Border
            {
                Height = 42,
                Width = 320,
                Background = Brushes.White,
                BorderBrush = (Brush)FindResource("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                HorizontalAlignment = HorizontalAlignment.Left,
                Child = searchHost
            };

            toolbar.Children.Add(searchBorder);


            // Gombstílus
            Button CreateActionButton(string text, Brush background)
            {
                return new Button
                {
                    Content = text,
                    Width = 105,
                    Height = 36,
                    Margin = new Thickness(5, 0, 0, 0),
                    Background = background,
                    Foreground = Brushes.White,
                    BorderThickness = new Thickness(0),
                    FontWeight = FontWeights.SemiBold,
                    FontSize = 12,
                    Cursor = Cursors.Hand,
                    Template = UiStyles.Button
                };
            }


            void RefreshUsers()
            {
                listPanel.Children.Clear();

                string filter = searchBox.Text.Trim();

                var visibleUsers = _users
                    .Where(user =>
                        user.Name.Contains(filter, StringComparison.OrdinalIgnoreCase) ||
                        user.Email.Contains(filter, StringComparison.OrdinalIgnoreCase) ||
                        user.Role.Contains(filter, StringComparison.OrdinalIgnoreCase) ||
                        user.Status.Contains(filter, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                foreach (var user in visibleUsers)
                {
                    var card = new Border
                    {
                        Background = Brushes.White,
                        CornerRadius = new CornerRadius(12),
                        Padding = new Thickness(20),
                        Margin = new Thickness(0, 0, 0, 12)
                    };

                    var row = new Grid();

                    row.ColumnDefinitions.Add(
                        new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

                    row.ColumnDefinitions.Add(
                        new ColumnDefinition { Width = GridLength.Auto });

                    // Felhasználói adatok
                    var info = new StackPanel
                    {
                        VerticalAlignment = VerticalAlignment.Center
                    };

                    info.Children.Add(new TextBlock
                    {
                        Text = user.Name,
                        FontSize = 18,
                        FontWeight = FontWeights.SemiBold,
                        Foreground = (Brush)FindResource("TextBrush")
                    });

                    info.Children.Add(new TextBlock
                    {
                        Text = user.Email,
                        FontSize = 14,
                        Foreground = (Brush)FindResource("MutedTextBrush"),
                        Margin = new Thickness(0, 5, 0, 0)
                    });

                    info.Children.Add(new TextBlock
                    {
                        Text = $"{user.Role} • {user.Status}",
                        FontSize = 14,
                        Foreground = (Brush)FindResource("MutedTextBrush"),
                        Margin = new Thickness(0, 5, 0, 0)
                    });

                    Grid.SetColumn(info, 0);
                    row.Children.Add(info);

                    // Műveletek
                    var actions = new StackPanel
                    {
                        Orientation = Orientation.Horizontal,
                        VerticalAlignment = VerticalAlignment.Center
                    };

                    // Szerkesztés
                    var editButton = CreateActionButton(
                        "SZERKESZTÉS",
                        (Brush)FindResource("PrimaryBrush"));

                    editButton.Click += async (s, e) =>
                    {
                        await EditUserAsync(user);
                        RefreshUsers();
                    };

                    // Törlés
                    var deleteButton = CreateActionButton(
                        "TÖRLÉS",
                        Brushes.Firebrick);

                    deleteButton.Click += async (s, e) =>
                    {
                        var answer = MessageBox.Show(
                            $"Biztosan törölni szeretnéd ezt a felhasználót?\n\n" +
                            $"{user.Name}\n{user.Email}",
                            "Felhasználó törlése",
                            MessageBoxButton.YesNo,
                            MessageBoxImage.Warning);

                        if (answer == MessageBoxResult.Yes)
                        {
                            await DeleteUserAsync(user);
                            RefreshUsers();
                        }
                    };

                    actions.Children.Add(editButton);
                    actions.Children.Add(deleteButton);

                    Grid.SetColumn(actions, 1);
                    row.Children.Add(actions);

                    card.Child = row;
                    listPanel.Children.Add(card);
                }

                if (visibleUsers.Count == 0)
                {
                    listPanel.Children.Add(new TextBlock
                    {
                        Text = filter.Length == 0
                            ? "Még nincs felhasználó."
                            : "Nincs találat a keresésre.",
                        Foreground = (Brush)FindResource("MutedTextBrush"),
                        FontSize = 14,
                        Margin = new Thickness(5, 5, 0, 0)
                    });
                }
            }

            mainPanel.Children.Add(toolbar);
            mainPanel.Children.Add(listPanel);

            RefreshUsers();

            var scrollViewer = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = mainPanel
            };

            ContentArea.Content = scrollViewer;
        }


        private Task EditUserAsync(UserItem user)
        {
            var editWindow = new Window
            {
                Title = "Felhasználó szerkesztése",
                Width = 420,
                Height = 350,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
                Owner = this,
                ResizeMode = ResizeMode.NoResize,
                Background = (Brush)FindResource("BackgroundBrush")
            };

            var panel = new StackPanel
            {
                Margin = new Thickness(25)
            };

            panel.Children.Add(new TextBlock
            {
                Text = "Felhasználó szerkesztése",
                FontSize = 21,
                FontWeight = FontWeights.Bold,
                Foreground = (Brush)FindResource("PrimaryBrush"),
                Margin = new Thickness(0, 0, 0, 20)
            });

            panel.Children.Add(new TextBlock
            {
                Text = "Felhasználónév",
                Margin = new Thickness(0, 0, 0, 7)
            });

            var nameBox = new TextBox
            {
                Text = user.Name,
                Height = 38,
                FontSize = 14,
                Padding = new Thickness(10),
                Margin = new Thickness(0, 0, 0, 18)
            };

            panel.Children.Add(nameBox);

            panel.Children.Add(new TextBlock
            {
                Text = "Szerepkör",
                Margin = new Thickness(0, 0, 0, 7)
            });

            var roleBox = UiKit.Combo(height: 38, fontSize: 14);
            roleBox.Margin = new Thickness(0, 0, 0, 25);

            roleBox.Items.Add("Diák");
            roleBox.Items.Add("Tanár");
            roleBox.Items.Add("Admin");

            roleBox.SelectedItem = user.Role;

            panel.Children.Add(roleBox);

            var buttons = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                HorizontalAlignment = HorizontalAlignment.Right
            };

            var cancelButton = UiKit.Button("MÉGSE", BtnKind.Outline, 100, 38);
            cancelButton.Margin = new Thickness(0, 0, 10, 0);

            cancelButton.Click += (s, e) =>
            {
                editWindow.DialogResult = false;
            };

            var saveButton = UiKit.Button("MENTÉS", BtnKind.Primary, 110, 38);

            saveButton.Click += (s, e) =>
            {
                if (string.IsNullOrWhiteSpace(nameBox.Text) ||
                    roleBox.SelectedItem == null)
                {
                    MessageBox.Show("Minden mezőt tölts ki!");
                    return;
                }

                editWindow.DialogResult = true;
            };

            buttons.Children.Add(cancelButton);
            buttons.Children.Add(saveButton);

            panel.Children.Add(buttons);

            editWindow.Content = panel;

            if (editWindow.ShowDialog() != true)
                return Task.CompletedTask;

            // Csak helyi módosítás, nincs adatbázis-hívás!
            user.Name = nameBox.Text.Trim();
            user.Role = roleBox.SelectedItem.ToString()!;

            MessageBox.Show(
                "A felhasználó adatai helyben módosultak.",
                "Sikeres módosítás",
                MessageBoxButton.OK,
                MessageBoxImage.Information);

            return Task.CompletedTask;
        }


        private Task DeleteUserAsync(UserItem user)
        {
            // Csak a helyi listából törlünk!
            _users.Remove(user);

            MessageBox.Show(
                "A felhasználó eltávolítva a helyi listából.",
                "Sikeres törlés",
                MessageBoxButton.OK,
                MessageBoxImage.Information);

            return Task.CompletedTask;
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

            _taskStatusFilter = UiKit.Combo(boxed: false);

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

            _taskSubjectFilter = UiKit.Combo(boxed: false);

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

            _taskLevelFilter = UiKit.Combo(boxed: false);

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
            Button addButton = UiKit.Button("+  ÚJ FELADAT", BtnKind.Primary, 145, 44);

            addButton.Click += AddTaskButton_Click;


            // SZERKESZTÉS
            Button editButton = UiKit.Button("SZERKESZTÉS", BtnKind.Secondary, 140, 44);
            editButton.Margin = new Thickness(10, 0, 0, 0);

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

            Button deleteButton = UiKit.Button("KIVÁLASZTOTT FELADAT TÖRLÉSE", BtnKind.Outline, 230, 42);
            deleteButton.Margin = new Thickness(0, 15, 0, 0);
            deleteButton.HorizontalAlignment = HorizontalAlignment.Left;

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
            public string Id { get; set; } = "";
            public string Name { get; set; } = "";
            public string Email { get; set; } = "";
            public string Role { get; set; } = "";
            public string Status { get; set; } = "";
        }

        // ================================
        // GET /admin válaszának modelljei
        // ================================
        public class DashboardStatsResponse
        {
            [JsonPropertyName("feladatokSzama")]
            public int FeladatokSzama { get; set; }

            [JsonPropertyName("feladatsorokSzama")]
            public int FeladatsorokSzama { get; set; }

            [JsonPropertyName("felhasznalokSzama")]
            public int FelhasznalokSzama { get; set; }
        }
        public class SubjectResponse
        {
            [JsonPropertyName("id")]
            public int Id { get; set; }

            [JsonPropertyName("nev")]
            public string Nev { get; set; } = "";

            [JsonPropertyName("feladatokSzama")]
            public int FeladatokSzama { get; set; }
        }

        public class TopicResponse
        {
            [JsonPropertyName("id")]
            public int Id { get; set; }

            [JsonPropertyName("nev")]
            public string Nev { get; set; } = "";

            [JsonPropertyName("tantargyId")]
            public int? TantargyId { get; set; }

            [JsonPropertyName("tantargyNev")]
            public string? TantargyNev { get; set; }

            [JsonPropertyName("feladatokSzama")]
            public int FeladatokSzama { get; set; }
        }
        public class LocalTopic
        {
            public string Name { get; set; } = "";
            public string Subject { get; set; } = "";
        }

        public class UserResponse
        {
            [JsonPropertyName("id")]
            public string Id { get; set; } = "";

            [JsonPropertyName("felhasznalonev")]
            public string? Felhasznalonev { get; set; }

            [JsonPropertyName("email")]
            public string? Email { get; set; }

            [JsonPropertyName("szerep")]
            public string? Szerep { get; set; }

            [JsonPropertyName("vanMaiTeszt")]
            public bool VanMaiTeszt { get; set; }
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

        private void SubjectFilter_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            ApplyTaskFilters();
        }

        private void LevelFilter_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            ApplyTaskFilters();
        }

        private void ExamSetSearchBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            ApplyExamSetFilter();
        }
    }
}