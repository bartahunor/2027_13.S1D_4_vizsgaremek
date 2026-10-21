using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using TudasterAdmin.Processing;

namespace TudasterAdmin
{
    internal class DraftEditorWindow : Window
    {
        private enum BtnKind { Primary, Secondary, Outline }

        private class RowRefs
        {
            public Border Row = null!;
            public TextBlock Status = null!;
            public TextBlock Name = null!;
            public TextBlock Points = null!;
        }

        private readonly DraftExam _draft;
        private readonly IReadOnlyList<TopicInfo> _allTopics;
        private List<TopicInfo> _topicList = new();
        private DraftTask? _current;
        private int _index = -1;
        private bool _loading;

        // Feladatsor adatai
        private readonly ComboBox _subjectBox = NewCombo();
        private readonly TextBox _yearBox = NewTextBox();
        private readonly ComboBox _levelBox = NewCombo();
        private readonly ComboBox _periodBox = NewCombo();
        private readonly TextBlock _draftWarnings = new()
        {
            TextWrapping = TextWrapping.Wrap,
            FontSize = 13,
            Foreground = Brushes.DarkOrange,
            Margin = new Thickness(0, 0, 0, 4)
        };

        // Feladatlista
        private readonly StackPanel _taskRowsPanel = new();
        private readonly List<RowRefs> _rows = new();

        // Feladat űrlap
        private readonly TextBlock _infoText = new() { FontSize = 13, TextWrapping = TextWrapping.Wrap };
        private readonly TextBlock _issuesText = new()
        {
            FontSize = 13,
            TextWrapping = TextWrapping.Wrap,
            Foreground = Brushes.DarkOrange,
            Margin = new Thickness(0, 6, 0, 0)
        };
        private readonly ComboBox _typeBox = NewCombo();
        private readonly TextBox _pointsBox = NewTextBox();
        private readonly ComboBox _topicBox = NewCombo();
        private readonly TextBox _questionBox = NewMultiLine(140);
        private readonly TextBox _optionsBox = NewMultiLine(80);
        private readonly TextBox _correctBox = NewMultiLine(80);
        private readonly TextBox _solutionBox = NewMultiLine(80);
        private readonly TextBox _sourceBox = NewMultiLine(110);
        private readonly TextBox _tableBox = NewMultiLine(100);
        private readonly Image _imagePreview = new()
        {
            MaxHeight = 260,
            Stretch = Stretch.Uniform,
            HorizontalAlignment = HorizontalAlignment.Left
        };
        private readonly Border _imageFrame = new()
        {
            CornerRadius = new CornerRadius(10),
            BorderThickness = new Thickness(1),
            Padding = new Thickness(8),
            Margin = new Thickness(0, 12, 0, 0),
            HorizontalAlignment = HorizontalAlignment.Left,
            Visibility = Visibility.Collapsed
        };
        private readonly Button _removeImageButton = MakeButton("KÉP TÖRLÉSE", BtnKind.Outline);
        private readonly CheckBox _approvedBox = new()
        {
            Content = "Jóváhagyva (ellenőriztem a feladatot)",
            FontSize = 14
        };
        private readonly TextBlock _statusText = new()
        {
            FontSize = 13,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 14, 0)
        };

        // ---------- Stílus-segédek (a MainWindow megjelenéséhez igazítva) ----------
        private static Brush Res(string key) => (Brush)Application.Current.FindResource(key);

        private static ComboBox NewCombo() => new ComboBox
        {
            BorderThickness = new Thickness(0),
            Background = Brushes.Transparent,
            FontSize = 13,
            VerticalContentAlignment = VerticalAlignment.Center
        };

        private static TextBox NewTextBox() => new TextBox
        {
            BorderThickness = new Thickness(0),
            Background = Brushes.Transparent,
            FontSize = 13,
            VerticalContentAlignment = VerticalAlignment.Center
        };

        private static TextBox NewMultiLine(double minHeight) => new TextBox
        {
            BorderThickness = new Thickness(0),
            Background = Brushes.Transparent,
            FontSize = 13,
            AcceptsReturn = true,
            TextWrapping = TextWrapping.Wrap,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            MinHeight = minHeight
        };

        // Egysoros mező: lekerekített, keretes doboz (mint a keresőmezők)
        private static Border BoxedLine(FrameworkElement inner, double width) => new Border
        {
            Width = width,
            Height = 44,
            Background = Res("WhiteBrush"),
            BorderBrush = Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12, 0, 12, 0),
            Child = inner
        };

        // Többsoros mező
        private static Border BoxedArea(FrameworkElement inner) => new Border
        {
            Background = Res("WhiteBrush"),
            BorderBrush = Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12, 8, 12, 8),
            Child = inner
        };

        private static StackPanel Field(string label, FrameworkElement box, double right = 14)
        {
            var p = new StackPanel { Margin = new Thickness(0, 0, right, 14) };
            p.Children.Add(new TextBlock
            {
                Text = label,
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = Res("MutedTextBrush"),
                Margin = new Thickness(0, 0, 0, 6)
            });
            p.Children.Add(box);
            return p;
        }

        private static Border Card(string? title, params UIElement[] children)
        {
            var panel = new StackPanel();
            if (title != null)
            {
                panel.Children.Add(new TextBlock
                {
                    Text = title,
                    FontSize = 16,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = Res("TextBrush"),
                    Margin = new Thickness(0, 0, 0, 14)
                });
            }
            foreach (var c in children) panel.Children.Add(c);

            return new Border
            {
                Background = Res("WhiteBrush"),
                BorderBrush = Res("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(14),
                Padding = new Thickness(22),
                Margin = new Thickness(0, 0, 0, 16),
                Child = panel
            };
        }

        private static Button MakeButton(string text, BtnKind kind, double width = double.NaN)
        {
            var b = new Button
            {
                Content = text,
                Height = 40,
                FontSize = 13,
                FontWeight = FontWeights.SemiBold,
                Cursor = Cursors.Hand,
                Padding = new Thickness(18, 0, 18, 0)
            };
            if (!double.IsNaN(width)) b.Width = width;

            switch (kind)
            {
                case BtnKind.Primary:
                    b.Background = Res("PrimaryBrush");
                    b.Foreground = Res("WhiteBrush");
                    b.BorderThickness = new Thickness(0);
                    break;
                case BtnKind.Secondary:
                    b.Background = Res("PrimaryLightBrush");
                    b.Foreground = Res("WhiteBrush");
                    b.BorderThickness = new Thickness(0);
                    break;
                default:
                    b.Background = Brushes.Transparent;
                    b.Foreground = Res("TextBrush");
                    b.BorderBrush = Res("BorderBrush");
                    b.BorderThickness = new Thickness(1);
                    break;
            }
            return b;
        }

        private static void SelectOrAdd(ComboBox box, string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                box.SelectedItem = null;
                return;
            }

            string? existing = box.Items.OfType<string>()
                .FirstOrDefault(i => string.Equals(i, value, StringComparison.OrdinalIgnoreCase));

            if (existing == null)
            {
                box.Items.Add(value);
                existing = value;
            }
            box.SelectedItem = existing;
        }

        // ---------- Felépítés ----------
        public DraftEditorWindow(
            DraftExam draft, IReadOnlyList<TopicInfo> topics, IReadOnlyList<string> subjectNames)
        {
            _draft = draft;
            _allTopics = topics;

            Title = "Piszkozat szerkesztése";
            Width = 1300;
            Height = 860;
            MinWidth = 1000;
            MinHeight = 650;
            WindowStartupLocation = WindowStartupLocation.CenterOwner;
            Background = Res("BackgroundBrush");

            _infoText.Foreground = Res("MutedTextBrush");
            _approvedBox.Foreground = Res("TextBrush");
            _statusText.Foreground = Res("MutedTextBrush");
            _imageFrame.BorderBrush = Res("BorderBrush");
            _imageFrame.Child = _imagePreview;
            _tableBox.FontFamily = new FontFamily("Consolas");

            // Legördülők feltöltése
            foreach (var s in subjectNames) _subjectBox.Items.Add(s);
            foreach (var l in DraftDefaults.Levels) _levelBox.Items.Add(l);
            foreach (var p in DraftDefaults.Periods) _periodBox.Items.Add(p);
            foreach (var t in DraftDefaults.TaskTypes) _typeBox.Items.Add(t);

            SelectOrAdd(_subjectBox, draft.Subject);
            SelectOrAdd(_levelBox, draft.Level);
            SelectOrAdd(_periodBox, draft.Period);
            _yearBox.Text = draft.Year?.ToString() ?? "";

            _topicBox.DisplayMemberPath = "Name";
            RebuildTopicList();

            _subjectBox.SelectionChanged += (s, e) =>
            {
                if (!_loading) OnSubjectChanged();
            };

            // ----- Gyökérelrendezés -----
            var root = new Grid { Margin = new Thickness(28) };
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            root.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

            // Fejléc
            var head = new StackPanel();
            head.Children.Add(new TextBlock
            {
                Text = "Piszkozat szerkesztése",
                FontSize = 26,
                FontWeight = FontWeights.Bold,
                Foreground = Res("TextBrush")
            });
            head.Children.Add(new TextBlock
            {
                Text = "Forrás: " + draft.SourcePdfName,
                FontSize = 14,
                Foreground = Res("MutedTextBrush"),
                Margin = new Thickness(0, 5, 0, 16)
            });

            var examFields = new WrapPanel();
            examFields.Children.Add(Field("Tantárgy", BoxedLine(_subjectBox, 240)));
            examFields.Children.Add(Field("Év", BoxedLine(_yearBox, 100)));
            examFields.Children.Add(Field("Szint", BoxedLine(_levelBox, 170)));
            examFields.Children.Add(Field("Időszak", BoxedLine(_periodBox, 150)));

            _draftWarnings.Text = string.Join("\n", draft.Warnings.Select(w => "⚠ " + w));
            _draftWarnings.Visibility = draft.Warnings.Count > 0 ? Visibility.Visible : Visibility.Collapsed;

            head.Children.Add(Card("Feladatsor adatai", examFields, _draftWarnings));
            Grid.SetRow(head, 0);
            root.Children.Add(head);

            // Törzs: bal oldalon a feladatok listája, jobb oldalon az űrlap
            var body = new Grid();
            body.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(290) });
            body.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

            var listGrid = new Grid();
            listGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            listGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });

            var listTitle = new TextBlock
            {
                Text = "Feladatok",
                FontSize = 16,
                FontWeight = FontWeights.SemiBold,
                Foreground = Res("TextBrush"),
                Margin = new Thickness(0, 0, 0, 14)
            };
            Grid.SetRow(listTitle, 0);
            listGrid.Children.Add(listTitle);

            var listScroll = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = _taskRowsPanel
            };
            Grid.SetRow(listScroll, 1);
            listGrid.Children.Add(listScroll);

            var listCard = new Border
            {
                Background = Res("WhiteBrush"),
                BorderBrush = Res("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(14),
                Padding = new Thickness(18),
                Margin = new Thickness(0, 0, 16, 0),
                Child = listGrid
            };
            Grid.SetColumn(listCard, 0);
            body.Children.Add(listCard);

            // Űrlap kártyák
            var form = new StackPanel();

            var basics = new WrapPanel();
            basics.Children.Add(Field("Típus", BoxedLine(_typeBox, 220)));
            basics.Children.Add(Field("Pont", BoxedLine(_pointsBox, 100)));
            basics.Children.Add(Field("Témakör", BoxedLine(_topicBox, 360)));
            form.Children.Add(Card("Feladat", _infoText, _issuesText, new Border { Height = 14 }, basics));

            form.Children.Add(Card("Kérdés és válaszok",
                Field("Kérdés (az a), b) részekkel együtt)", BoxedArea(_questionBox), 0),
                Field("Válaszlehetőségek (soronként egy)", BoxedArea(_optionsBox), 0),
                Field("Helyes válaszok (soronként egy)", BoxedArea(_correctBox), 0),
                Field("Megoldás menete", BoxedArea(_solutionBox), 0)));

            var addImageButton = MakeButton("KÉP HOZZÁRENDELÉSE…", BtnKind.Secondary);
            addImageButton.Click += (s, e) => AddImage();
            _removeImageButton.Margin = new Thickness(8, 0, 0, 0);
            _removeImageButton.Click += (s, e) => RemoveImage();

            var imageButtons = new StackPanel { Orientation = Orientation.Horizontal };
            imageButtons.Children.Add(addImageButton);
            imageButtons.Children.Add(_removeImageButton);

            var imageLabel = new TextBlock
            {
                Text = "Kép a forráshoz (forrásonként egy kép)",
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = Res("MutedTextBrush"),
                Margin = new Thickness(0, 0, 0, 6)
            };

            form.Children.Add(Card("Forrás és kép",
                Field("Forrásszöveg", BoxedArea(_sourceBox), 0),
                imageLabel,
                imageButtons,
                _imageFrame));

            var tableHint = new TextBlock
            {
                Text = "Az első sor az oszlopfejléc, a cellákat a | jel választja el. " +
                       "A ?-lel kezdődő cellát a diák tölti ki, a ? után a helyes érték áll.",
                FontSize = 12,
                TextWrapping = TextWrapping.Wrap,
                Foreground = Res("MutedTextBrush"),
                Margin = new Thickness(0, 0, 0, 10)
            };
            form.Children.Add(Card("Táblázat", tableHint, BoxedArea(_tableBox)));

            form.Children.Add(Card("Jóváhagyás", _approvedBox));

            var formScroll = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Content = form
            };
            Grid.SetColumn(formScroll, 1);
            body.Children.Add(formScroll);

            Grid.SetRow(body, 1);
            root.Children.Add(body);

            // Alsó sáv
            var prevButton = MakeButton("←  ELŐZŐ", BtnKind.Outline, 120);
            var nextButton = MakeButton("KÖVETKEZŐ  →", BtnKind.Outline, 150);
            nextButton.Margin = new Thickness(8, 0, 0, 0);
            var saveButton = MakeButton("MENTÉS", BtnKind.Primary, 130);

            prevButton.Click += (s, e) => SelectIndex(_index - 1);
            nextButton.Click += (s, e) => SelectIndex(_index + 1);
            saveButton.Click += (s, e) => SaveNow();

            var navButtons = new StackPanel { Orientation = Orientation.Horizontal };
            navButtons.Children.Add(prevButton);
            navButtons.Children.Add(nextButton);

            var saveSide = new StackPanel { Orientation = Orientation.Horizontal };
            saveSide.Children.Add(_statusText);
            saveSide.Children.Add(saveButton);

            var footerGrid = new Grid();
            footerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            footerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            Grid.SetColumn(navButtons, 0);
            Grid.SetColumn(saveSide, 1);
            footerGrid.Children.Add(navButtons);
            footerGrid.Children.Add(saveSide);

            var footer = new Border
            {
                Background = Res("WhiteBrush"),
                BorderBrush = Res("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(14),
                Padding = new Thickness(18, 12, 18, 12),
                Margin = new Thickness(0, 16, 0, 0),
                Child = footerGrid
            };
            Grid.SetRow(footer, 2);
            root.Children.Add(footer);

            Content = root;

            // ----- Feladatsorok felépítése és az első kijelölése -----
            for (int i = 0; i < _draft.Tasks.Count; i++)
            {
                var refs = BuildRow(i);
                _rows.Add(refs);
                _taskRowsPanel.Children.Add(refs.Row);
            }

            UpdateRows();
            if (_draft.Tasks.Count > 0) SelectIndex(0);
        }

        protected override void OnClosing(CancelEventArgs e)
        {
            ApplyForm();
            DraftStore.Save(_draft);
            base.OnClosing(e);
        }

        // ---------- Feladatlista ----------
        private RowRefs BuildRow(int index)
        {
            var refs = new RowRefs
            {
                Status = new TextBlock { FontSize = 14, VerticalAlignment = VerticalAlignment.Center },
                Name = new TextBlock { FontSize = 14, FontWeight = FontWeights.SemiBold, VerticalAlignment = VerticalAlignment.Center },
                Points = new TextBlock { FontSize = 12, VerticalAlignment = VerticalAlignment.Center }
            };

            var grid = new Grid();
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(26) });
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            Grid.SetColumn(refs.Status, 0);
            Grid.SetColumn(refs.Name, 1);
            Grid.SetColumn(refs.Points, 2);
            grid.Children.Add(refs.Status);
            grid.Children.Add(refs.Name);
            grid.Children.Add(refs.Points);

            refs.Row = new Border
            {
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(12, 10, 12, 10),
                Margin = new Thickness(0, 0, 0, 6),
                Cursor = Cursors.Hand,
                Background = Brushes.Transparent,
                Child = grid
            };

            int idx = index;
            refs.Row.MouseLeftButtonUp += (s, e) => SelectIndex(idx);

            return refs;
        }

        private void UpdateRows()
        {
            for (int i = 0; i < _rows.Count; i++)
            {
                var t = _draft.Tasks[i];
                var r = _rows[i];
                bool selected = i == _index;

                var missing = DraftValidator.Missing(_draft, t);
                string glyph = t.Approved ? "✓" : missing.Count > 0 ? "⚠" : "○";
                Brush glyphBrush = t.Approved
                    ? Brushes.Green
                    : missing.Count > 0 ? Brushes.DarkOrange : Res("MutedTextBrush");

                r.Row.Background = selected ? Res("PrimaryBrush") : Brushes.Transparent;
                r.Status.Text = glyph;
                r.Status.Foreground = selected ? Res("WhiteBrush") : glyphBrush;
                r.Name.Text = $"{t.Number}. feladat";
                r.Name.Foreground = selected ? Res("WhiteBrush") : Res("TextBrush");
                r.Points.Text = t.Points.HasValue ? $"{t.Points} p" : "";
                r.Points.Foreground = selected ? Res("WhiteBrush") : Res("MutedTextBrush");
            }
        }

        private void SelectIndex(int index)
        {
            if (index < 0 || index >= _draft.Tasks.Count) return;

            ApplyForm();
            DraftStore.Save(_draft);

            _index = index;
            LoadForm(_draft.Tasks[index]);
            UpdateRows();
            _rows[index].Row.BringIntoView();
        }

        // ---------- Tantárgy és témakörök ----------
        private void RebuildTopicList()
        {
            string subject = _subjectBox.SelectedItem as string ?? "";
            _topicList = _allTopics
                .Where(t => string.Equals(t.Subject, subject, StringComparison.OrdinalIgnoreCase))
                .ToList();

            // Ha a tantárgy neve nem egyezik pontosan, az összes témakört kínáljuk fel.
            if (_topicList.Count == 0) _topicList = _allTopics.ToList();

            _topicBox.ItemsSource = _topicList;
        }

        private void OnSubjectChanged()
        {
            int? keepTopic = (_topicBox.SelectedItem as TopicInfo)?.Id;
            RebuildTopicList();
            _topicBox.SelectedItem = _topicList.FirstOrDefault(t => t.Id == keepTopic);
        }

        private void ApplyHeader()
        {
            _draft.Subject = _subjectBox.SelectedItem as string ?? _draft.Subject;
            _draft.Year = int.TryParse(_yearBox.Text.Trim(), out int y) ? y : (int?)null;
            _draft.Level = _levelBox.SelectedItem as string ?? _draft.Level;
            _draft.Period = _periodBox.SelectedItem as string ?? _draft.Period;
        }

        // ---------- Űrlap <-> modell ----------
        private void LoadForm(DraftTask t)
        {
            _loading = true;
            _current = t;

            string pages = t.PageFrom == t.PageTo ? $"{t.PageFrom}. oldal" : $"{t.PageFrom}–{t.PageTo}. oldal";
            _infoText.Text = $"{t.Number}. feladat • {pages}"
                + (t.HasFigure ? " • ábra tartozik hozzá" : "")
                + (t.AnswerLines > 0 ? $" • {t.AnswerLines} válaszsor" : "");

            var issues = new List<string>();
            var missing = DraftValidator.Missing(_draft, t);
            if (missing.Count > 0) issues.Add("Hiányzik: " + string.Join(", ", missing));
            issues.AddRange(t.Warnings.Select(w => "⚠ " + w));
            _issuesText.Text = string.Join("\n", issues);
            _issuesText.Visibility = issues.Count > 0 ? Visibility.Visible : Visibility.Collapsed;

            SelectOrAdd(_typeBox, t.TypeName);
            _pointsBox.Text = t.Points?.ToString() ?? "";
            _topicBox.SelectedItem = _topicList.FirstOrDefault(x => x.Id == t.TopicId);
            _questionBox.Text = t.Question;
            _optionsBox.Text = string.Join("\n", t.Options);
            _correctBox.Text = string.Join("\n", t.CorrectAnswers);
            _solutionBox.Text = t.Solution;
            _tableBox.Text = RenderTable(t);
            _approvedBox.IsChecked = t.Approved;

            var src = FindSource(t);
            _sourceBox.Text = src?.Text ?? "";
            ShowImage(src);

            _loading = false;
        }

        private void ApplyForm()
        {
            ApplyHeader();
            if (_current == null) return;

            var t = _current;
            t.TypeName = _typeBox.SelectedItem as string ?? "";
            t.Points = int.TryParse(_pointsBox.Text.Trim(), out int p) ? p : (int?)null;
            t.TopicId = (_topicBox.SelectedItem as TopicInfo)?.Id;
            t.Question = _questionBox.Text.Trim();
            t.Options = Lines(_optionsBox.Text);
            t.CorrectAnswers = Lines(_correctBox.Text);
            t.Solution = _solutionBox.Text.Trim();
            t.Approved = _approvedBox.IsChecked == true;
            ParseTable(t, _tableBox.Text);

            string sourceText = _sourceBox.Text.Trim();
            var src = FindSource(t);
            if (src != null)
                src.Text = sourceText;
            else if (sourceText.Length > 0)
                EnsureSource(t).Text = sourceText;
        }

        private void SaveNow()
        {
            ApplyForm();
            DraftStore.Save(_draft);
            UpdateRows();
            _statusText.Text = $"Mentve: {DateTime.Now:HH:mm:ss}";
        }

        private static List<string> Lines(string s) =>
            s.Split('\n').Select(l => l.Trim()).Where(l => l.Length > 0).ToList();

        // ---------- Táblázat ----------
        private static string RenderTable(DraftTask t)
        {
            if (t.TableColumns.Count == 0 && t.TableCells.Count == 0) return "";

            var sb = new System.Text.StringBuilder();
            sb.AppendLine(string.Join(" | ", t.TableColumns));
            foreach (var row in t.TableCells.GroupBy(c => c.Row).OrderBy(g => g.Key))
            {
                sb.AppendLine(string.Join(" | ",
                    row.OrderBy(c => c.Column).Select(c => c.Visible ? c.Value : "?" + c.Value)));
            }
            return sb.ToString().TrimEnd();
        }

        private static void ParseTable(DraftTask t, string text)
        {
            t.TableColumns = new List<string>();
            t.TableCells = new List<DraftCell>();

            var lines = text.Split('\n')
                .Select(l => l.Trim('\r'))
                .Where(l => l.Trim().Length > 0)
                .ToList();
            if (lines.Count == 0) return;

            t.TableColumns = lines[0].Split('|').Select(c => c.Trim()).ToList();

            for (int r = 1; r < lines.Count; r++)
            {
                var cells = lines[r].Split('|').Select(c => c.Trim()).ToList();
                for (int c = 0; c < cells.Count; c++)
                {
                    bool hidden = cells[c].StartsWith("?");
                    t.TableCells.Add(new DraftCell
                    {
                        Row = r,
                        Column = c + 1,
                        Value = hidden ? cells[c].Substring(1).Trim() : cells[c],
                        Visible = !hidden
                    });
                }
            }
        }

        // ---------- Forrás és kép ----------
        private DraftSource? FindSource(DraftTask t) =>
            t.SourceKey == null ? null : _draft.Sources.FirstOrDefault(s => s.Key == t.SourceKey);

        private DraftSource EnsureSource(DraftTask t)
        {
            var src = FindSource(t);
            if (src != null) return src;

            int next = _draft.Sources
                .Select(s => int.TryParse(s.Key.TrimStart('f'), out int k) ? k : 0)
                .DefaultIfEmpty(0)
                .Max() + 1;

            src = new DraftSource { Key = "f" + next };
            _draft.Sources.Add(src);
            t.SourceKey = src.Key;
            return src;
        }

        private void AddImage()
        {
            if (_current == null) return;

            var dialog = new Microsoft.Win32.OpenFileDialog
            {
                Title = "Kép kiválasztása",
                Filter = "Képek (*.png;*.jpg;*.jpeg;*.gif;*.bmp)|*.png;*.jpg;*.jpeg;*.gif;*.bmp",
                CheckFileExists = true
            };
            if (dialog.ShowDialog(this) != true) return;

            ApplyForm();
            var src = EnsureSource(_current);
            DraftStore.SetSourceImage(_draft, src, dialog.FileName);
            DraftStore.Save(_draft);
            ShowImage(src);
        }

        private void RemoveImage()
        {
            if (_current == null) return;
            var src = FindSource(_current);
            if (src == null) return;

            DraftStore.RemoveSourceImage(_draft, src);
            DraftStore.Save(_draft);
            ShowImage(src);
        }

        private void ShowImage(DraftSource? src)
        {
            _imagePreview.Source = null;
            _imageFrame.Visibility = Visibility.Collapsed;
            _removeImageButton.IsEnabled = false;

            string? path = src == null ? null : DraftStore.ImagePath(_draft, src.ImageFile);
            if (path == null || !File.Exists(path)) return;

            var bmp = new BitmapImage();
            bmp.BeginInit();
            bmp.CacheOption = BitmapCacheOption.OnLoad;   // ne zárolja a fájlt
            bmp.UriSource = new Uri(path);
            bmp.EndInit();
            bmp.Freeze();

            _imagePreview.Source = bmp;
            _imageFrame.Visibility = Visibility.Visible;
            _removeImageButton.IsEnabled = true;
        }
    }
}