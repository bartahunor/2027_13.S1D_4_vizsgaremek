using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Text;
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

        private static readonly Brush GrayBg = new SolidColorBrush(Color.FromRgb(245, 245, 245));
        private static readonly Brush SolutionBg = new SolidColorBrush(Color.FromRgb(240, 247, 241));
        private static readonly Brush SolutionBorder = new SolidColorBrush(Color.FromRgb(200, 225, 205));
        private static readonly Brush GoodText = new SolidColorBrush(Color.FromRgb(30, 110, 55));

        private readonly DraftExam _draft;
        private readonly IReadOnlyList<TopicInfo> _allTopics;
        private List<TopicInfo> _topicList = new();
        private DraftTask? _current;
        private int _index = -1;
        private bool _loading;
        private bool _busy;
        private bool _overviewMode;

        private StackPanel _headPanel = null!;
        private Grid _bodyGrid = null!;

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
            Margin = new Thickness(0, 0, 0, 8)
        };
        private readonly Button _keyButton = MakeButton("MEGOLDÓKULCS BETÖLTÉSE…", BtnKind.Secondary);
        private readonly TextBlock _keyStatus = new()
        {
            FontSize = 13,
            TextWrapping = TextWrapping.Wrap,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(14, 0, 0, 0)
        };

        // Feladatlista
        private readonly StackPanel _taskRowsPanel = new();
        private readonly List<RowRefs> _rows = new();

        // Nézetváltó és áttekintés
        private readonly Button _modeEditButton = MakeButton("SZERKESZTÉS", BtnKind.Primary, 150);
        private readonly Button _modeOverviewButton = MakeButton("ÁTTEKINTÉS", BtnKind.Outline, 150);
        private readonly ScrollViewer _editScroll = new() { VerticalScrollBarVisibility = ScrollBarVisibility.Auto };
        private readonly ScrollViewer _overviewScroll = new()
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Visibility = Visibility.Collapsed
        };
        private readonly StackPanel _overviewPanel = new();
        private readonly Dictionary<int, Border> _overviewCards = new();
        private readonly CheckBox _onlyIssuesBox = new()
        {
            Content = "Csak a figyelmeztetéssel vagy hiányzó adattal rendelkező feladatok",
            FontSize = 13,
            Margin = new Thickness(0, 0, 0, 12)
        };

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
        private readonly TextBox _questionBox = NewMultiLine(160);
        private readonly TextBox _optionsBox = NewMultiLine(80);
        private readonly TextBox _correctBox = NewMultiLine(80);
        private readonly TextBox _solutionBox = NewMultiLine(160);
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

        private static void StyleButton(Button b, BtnKind kind)
        {
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
            StyleButton(b, kind);
            return b;
        }

        private static TextBlock SectionLabel(string text) => new TextBlock
        {
            Text = text,
            FontSize = 12,
            FontWeight = FontWeights.SemiBold,
            Foreground = Res("MutedTextBrush"),
            Margin = new Thickness(0, 0, 0, 6)
        };

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
            Width = 1400;
            Height = 880;
            MinWidth = 1100;
            MinHeight = 650;
            WindowStartupLocation = WindowStartupLocation.CenterOwner;
            Background = Res("BackgroundBrush");

            _infoText.Foreground = Res("MutedTextBrush");
            _approvedBox.Foreground = Res("TextBrush");
            _statusText.Foreground = Res("MutedTextBrush");
            _keyStatus.Foreground = Res("MutedTextBrush");
            _onlyIssuesBox.Foreground = Res("TextBrush");
            _imageFrame.BorderBrush = Res("BorderBrush");
            _imageFrame.Child = _imagePreview;
            _tableBox.FontFamily = new FontFamily("Consolas");

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
            _headPanel = head;
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

            _keyButton.Click += (s, e) => LoadAnswerKey();
            var keyRow = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 4, 0, 0) };
            keyRow.Children.Add(_keyButton);
            keyRow.Children.Add(_keyStatus);

            RefreshDraftWarnings();
            RefreshKeyStatus();

            head.Children.Add(Card("Feladatsor adatai", examFields, _draftWarnings, keyRow));
            Grid.SetRow(head, 0);
            root.Children.Add(head);

            // Törzs: bal oldalon a feladatok listája, jobb oldalon a nézet
            var body = new Grid();
            _bodyGrid = body;
            body.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(280) });
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

            // ----- Szerkesztő nézet (űrlap) -----
            var form = new StackPanel();

            var basics = new WrapPanel();
            basics.Children.Add(Field("Típus", BoxedLine(_typeBox, 220)));
            basics.Children.Add(Field("Pont", BoxedLine(_pointsBox, 100)));
            basics.Children.Add(Field("Témakör", BoxedLine(_topicBox, 360)));
            form.Children.Add(Card("Feladat", _infoText, _issuesText, new Border { Height = 14 }, basics));

            // Feladat és megoldás egymás mellett
            var qa = new Grid();
            qa.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            qa.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

            var left = new StackPanel { Margin = new Thickness(0, 0, 12, 0) };
            left.Children.Add(Field("Kérdés (az a), b) részekkel együtt)", BoxedArea(_questionBox), 0));
            left.Children.Add(Field("Válaszlehetőségek (soronként egy)", BoxedArea(_optionsBox), 0));
            Grid.SetColumn(left, 0);
            qa.Children.Add(left);

            var rightInner = new StackPanel();
            rightInner.Children.Add(new TextBlock
            {
                Text = "Megoldás",
                FontSize = 14,
                FontWeight = FontWeights.SemiBold,
                Foreground = GoodText,
                Margin = new Thickness(0, 0, 0, 10)
            });
            rightInner.Children.Add(Field("Helyes válaszok (soronként egy)", BoxedArea(_correctBox), 0));
            rightInner.Children.Add(Field("Megoldás menete / értékelési szempontok", BoxedArea(_solutionBox), 0));
            var right = new Border
            {
                Background = SolutionBg,
                BorderBrush = SolutionBorder,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(16, 14, 16, 2),
                Child = rightInner
            };
            Grid.SetColumn(right, 1);
            qa.Children.Add(right);

            form.Children.Add(Card("Feladat és megoldás", qa));

            var addImageButton = MakeButton("KÉP HOZZÁRENDELÉSE…", BtnKind.Secondary);
            addImageButton.Click += (s, e) => AddImage();
            _removeImageButton.Margin = new Thickness(8, 0, 0, 0);
            _removeImageButton.Click += (s, e) => RemoveImage();

            var imageButtons = new StackPanel { Orientation = Orientation.Horizontal };
            imageButtons.Children.Add(addImageButton);
            imageButtons.Children.Add(_removeImageButton);

            form.Children.Add(Card("Forrás és kép",
                Field("Forrásszöveg", BoxedArea(_sourceBox), 0),
                SectionLabel("Kép a forráshoz (forrásonként egy kép)"),
                imageButtons,
                _imageFrame));

            var tableHint = new TextBlock
            {
                Text = "Az első sor az oszlopfejléc, a cellákat a | jel választja el. " +
                       "A ?-lel kezdődő cellát a diák tölti ki, a ? után a helyes érték áll " +
                       "(a megoldókulcs betöltése ezeket automatikusan kitölti).",
                FontSize = 12,
                TextWrapping = TextWrapping.Wrap,
                Foreground = Res("MutedTextBrush"),
                Margin = new Thickness(0, 0, 0, 10)
            };
            form.Children.Add(Card("Táblázat", tableHint, BoxedArea(_tableBox)));

            form.Children.Add(Card("Jóváhagyás", _approvedBox));

            _editScroll.Content = form;
            _editScroll.Margin = new Thickness(0, 0, 8, 0);

            // ----- Áttekintő nézet -----
            var overviewContent = new StackPanel();
            overviewContent.Children.Add(_onlyIssuesBox);
            overviewContent.Children.Add(_overviewPanel);
            _overviewScroll.Content = overviewContent;
            _overviewScroll.Margin = new Thickness(0, 0, 8, 0);
            _onlyIssuesBox.Checked += (s, e) => BuildOverview();
            _onlyIssuesBox.Unchecked += (s, e) => BuildOverview();

            // ----- Jobb oldali oszlop: nézetváltó + tartalom -----
            var rightGrid = new Grid { Margin = new Thickness(0) };
            rightGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            rightGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });

            var modeBar = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 12) };
            _modeOverviewButton.Margin = new Thickness(8, 0, 0, 0);
            modeBar.Children.Add(_modeEditButton);
            modeBar.Children.Add(_modeOverviewButton);
            _modeEditButton.Click += (s, e) => SetMode(false);
            _modeOverviewButton.Click += (s, e) => SetMode(true);

            Grid.SetRow(modeBar, 0);
            Grid.SetRow(_editScroll, 1);
            Grid.SetRow(_overviewScroll, 1);
            rightGrid.Children.Add(modeBar);
            rightGrid.Children.Add(_editScroll);
            rightGrid.Children.Add(_overviewScroll);

            Grid.SetColumn(rightGrid, 1);
            body.Children.Add(rightGrid);

            Grid.SetRow(body, 1);
            root.Children.Add(body);

            // ----- Alsó sáv -----
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

            // ----- Feladatlista felépítése és az első kijelölése -----
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
            if (_busy)
            {
                MessageBox.Show(this,
                    "A megoldókulcs feldolgozása még folyamatban van. Várd meg, amíg befejeződik.",
                    "Feldolgozás", MessageBoxButton.OK, MessageBoxImage.Information);
                e.Cancel = true;
                return;
            }

            ApplyForm();
            DraftStore.Save(_draft);
            base.OnClosing(e);
        }

        // ---------- Nézetváltás ----------
        private void SetMode(bool overview)
        {
            if (overview)
            {
                ApplyForm();
                DraftStore.Save(_draft);
                UpdateRows();
                BuildOverview();
            }

            _overviewMode = overview;
            _editScroll.Visibility = overview ? Visibility.Collapsed : Visibility.Visible;
            _overviewScroll.Visibility = overview ? Visibility.Visible : Visibility.Collapsed;
            StyleButton(_modeEditButton, overview ? BtnKind.Outline : BtnKind.Primary);
            StyleButton(_modeOverviewButton, overview ? BtnKind.Primary : BtnKind.Outline);
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
                bool keyWarning = t.Warnings.Any(w => w.StartsWith(AnswerKeyMapper.Prefix));
                bool problem = missing.Count > 0 || keyWarning;

                string glyph = t.Approved ? "✓" : problem ? "⚠" : "○";
                Brush glyphBrush = t.Approved
                    ? Brushes.Green
                    : problem ? Brushes.DarkOrange : Res("MutedTextBrush");

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

            if (_overviewMode && _overviewCards.TryGetValue(index, out var card))
                card.BringIntoView();
        }

        // ---------- Áttekintő nézet ----------
        private static bool HasAnswer(DraftTask t) => AnswerKeyMapper.HasAnswer(t);

        private void BuildOverview()
        {
            _overviewPanel.Children.Clear();
            _overviewCards.Clear();

            bool onlyIssues = _onlyIssuesBox.IsChecked == true;
            int shown = 0;

            for (int i = 0; i < _draft.Tasks.Count; i++)
            {
                var t = _draft.Tasks[i];
                var missing = DraftValidator.Missing(_draft, t);
                bool hasAnswer = HasAnswer(t);

                if (onlyIssues && missing.Count == 0 && t.Warnings.Count == 0 && hasAnswer)
                    continue;

                var card = BuildOverviewCard(i, t, missing, hasAnswer);
                _overviewCards[i] = card;
                _overviewPanel.Children.Add(card);
                shown++;
            }

            if (shown == 0)
            {
                _overviewPanel.Children.Add(new TextBlock
                {
                    Text = "Nincs a szűrésnek megfelelő feladat.",
                    FontSize = 13,
                    Foreground = Res("MutedTextBrush")
                });
            }
        }

        private Border BuildOverviewCard(int index, DraftTask t, List<string> missing, bool hasAnswer)
        {
            bool keyWarning = t.Warnings.Any(w => w.StartsWith(AnswerKeyMapper.Prefix));
            bool problem = missing.Count > 0 || keyWarning;
            string glyph = t.Approved ? "✓" : problem ? "⚠" : "○";

            string topicName = _allTopics.FirstOrDefault(x => x.Id == t.TopicId)?.Name ?? "nincs témakör";
            string type = string.IsNullOrWhiteSpace(t.TypeName) ? "nincs típus" : t.TypeName;
            string points = t.Points.HasValue ? $"{t.Points} pont" : "nincs pont";
            string pages = t.PageFrom == t.PageTo ? $"{t.PageFrom}. oldal" : $"{t.PageFrom}–{t.PageTo}. oldal";

            // Fejléc
            var header = new Grid { Margin = new Thickness(0, 0, 0, 14) };
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            var title = new StackPanel();
            title.Children.Add(new TextBlock
            {
                Text = $"{glyph}  {t.Number}. feladat",
                FontSize = 16,
                FontWeight = FontWeights.SemiBold,
                Foreground = Res("PrimaryBrush")
            });
            title.Children.Add(new TextBlock
            {
                Text = $"{type} • {points} • {topicName} • {pages}",
                FontSize = 12,
                Foreground = Res("MutedTextBrush"),
                Margin = new Thickness(0, 3, 0, 0)
            });
            Grid.SetColumn(title, 0);
            header.Children.Add(title);

            var editButton = MakeButton("SZERKESZTÉS", BtnKind.Outline, 130);
            editButton.Height = 34;
            editButton.Click += (s, e) =>
            {
                SelectIndex(index);
                SetMode(false);
            };
            Grid.SetColumn(editButton, 1);
            header.Children.Add(editButton);

            // Törzs: bal oldalon a feladat, jobb oldalon a megoldás
            var body = new Grid();
            body.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            body.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

            var leftPanel = new StackPanel { Margin = new Thickness(0, 0, 14, 0) };
            leftPanel.Children.Add(SectionLabel("Feladat"));

            var src = FindSource(t);
            if (src != null && !string.IsNullOrWhiteSpace(src.Text))
            {
                leftPanel.Children.Add(new Border
                {
                    Background = GrayBg,
                    CornerRadius = new CornerRadius(8),
                    Padding = new Thickness(10),
                    Margin = new Thickness(0, 0, 0, 10),
                    Child = new ScrollViewer
                    {
                        MaxHeight = 140,
                        VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                        Content = new TextBlock
                        {
                            Text = src.Text,
                            FontSize = 12,
                            TextWrapping = TextWrapping.Wrap,
                            Foreground = Res("MutedTextBrush")
                        }
                    }
                });
            }

            leftPanel.Children.Add(new TextBlock
            {
                Text = string.IsNullOrWhiteSpace(t.Question) ? "(nincs kérdés)" : t.Question,
                FontSize = 13,
                TextWrapping = TextWrapping.Wrap,
                Foreground = Res("TextBrush")
            });

            foreach (string option in t.Options)
            {
                leftPanel.Children.Add(new TextBlock
                {
                    Text = "• " + option,
                    FontSize = 13,
                    TextWrapping = TextWrapping.Wrap,
                    Foreground = Res("TextBrush"),
                    Margin = new Thickness(12, 4, 0, 0)
                });
            }

            string tableText = RenderTableView(t);
            if (tableText.Length > 0)
            {
                leftPanel.Children.Add(new Border
                {
                    Background = GrayBg,
                    CornerRadius = new CornerRadius(8),
                    Padding = new Thickness(10),
                    Margin = new Thickness(0, 10, 0, 0),
                    Child = new TextBlock
                    {
                        Text = tableText,
                        FontFamily = new FontFamily("Consolas"),
                        FontSize = 12,
                        Foreground = Res("TextBrush")
                    }
                });
                leftPanel.Children.Add(new TextBlock
                {
                    Text = "[ ] = a diák tölti ki, bent a helyes érték",
                    FontSize = 11,
                    Foreground = Res("MutedTextBrush"),
                    Margin = new Thickness(0, 4, 0, 0)
                });
            }

            Grid.SetColumn(leftPanel, 0);
            body.Children.Add(leftPanel);

            var rightPanel = new StackPanel();
            rightPanel.Children.Add(new TextBlock
            {
                Text = "Megoldás",
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = GoodText,
                Margin = new Thickness(0, 0, 0, 6)
            });

            if (!hasAnswer)
            {
                rightPanel.Children.Add(new TextBlock
                {
                    Text = "Ehhez a feladathoz még nincs megoldás.",
                    FontSize = 13,
                    FontStyle = FontStyles.Italic,
                    Foreground = Res("MutedTextBrush")
                });
            }
            else
            {
                foreach (string answer in t.CorrectAnswers)
                {
                    rightPanel.Children.Add(new TextBlock
                    {
                        Text = "✓ " + answer,
                        FontSize = 13,
                        FontWeight = FontWeights.SemiBold,
                        TextWrapping = TextWrapping.Wrap,
                        Foreground = GoodText,
                        Margin = new Thickness(0, 0, 0, 4)
                    });
                }

                if (!string.IsNullOrWhiteSpace(t.Solution))
                {
                    rightPanel.Children.Add(new TextBlock
                    {
                        Text = "Megoldás menete / értékelési szempontok",
                        FontSize = 11,
                        Foreground = Res("MutedTextBrush"),
                        Margin = new Thickness(0, 8, 0, 3)
                    });
                    rightPanel.Children.Add(new TextBlock
                    {
                        Text = t.Solution,
                        FontSize = 13,
                        TextWrapping = TextWrapping.Wrap,
                        Foreground = Res("TextBrush")
                    });
                }
            }

            var rightBox = new Border
            {
                Background = SolutionBg,
                BorderBrush = SolutionBorder,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(14),
                Child = rightPanel
            };
            Grid.SetColumn(rightBox, 1);
            body.Children.Add(rightBox);

            // Kártya
            var panel = new StackPanel();
            panel.Children.Add(header);
            panel.Children.Add(body);

            if (missing.Count > 0)
            {
                panel.Children.Add(new TextBlock
                {
                    Text = "Hiányzik: " + string.Join(", ", missing),
                    FontSize = 12,
                    Foreground = Brushes.DarkOrange,
                    Margin = new Thickness(0, 12, 0, 0)
                });
            }

            foreach (string warning in t.Warnings)
            {
                panel.Children.Add(new TextBlock
                {
                    Text = "⚠ " + warning,
                    FontSize = 12,
                    TextWrapping = TextWrapping.Wrap,
                    Foreground = Brushes.DarkOrange,
                    Margin = new Thickness(0, 6, 0, 0)
                });
            }

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

        private static string RenderTableView(DraftTask t)
        {
            if (t.TableColumns.Count == 0 && t.TableCells.Count == 0) return "";

            var sb = new StringBuilder();
            sb.AppendLine(string.Join(" | ", t.TableColumns));
            foreach (var row in t.TableCells.GroupBy(c => c.Row).OrderBy(g => g.Key))
            {
                sb.AppendLine(string.Join(" | ", row.OrderBy(c => c.Column).Select(c =>
                    c.Visible ? c.Value : "[ " + (string.IsNullOrWhiteSpace(c.Value) ? "?" : c.Value) + " ]")));
            }
            return sb.ToString().TrimEnd();
        }

        // ---------- Megoldókulcs betöltése ----------
        private void SetBusy(bool busy, string? message)
        {
            _busy = busy;
            _headPanel.IsEnabled = !busy;
            _bodyGrid.IsEnabled = !busy;
            if (message != null) _keyStatus.Text = message;
        }

        private void RefreshKeyStatus()
        {
            _keyStatus.Text = _draft.AnswerKeyAppliedUtc.HasValue
                ? $"Betöltve: {_draft.AnswerKeyPdfName} ({_draft.AnswerKeyAppliedUtc.Value.ToLocalTime():yyyy.MM.dd HH:mm})"
                : "Még nincs betöltve megoldókulcs.";
        }

        private void RefreshDraftWarnings()
        {
            _draftWarnings.Text = string.Join("\n", _draft.Warnings.Select(w => "⚠ " + w));
            _draftWarnings.Visibility = _draft.Warnings.Count > 0 ? Visibility.Visible : Visibility.Collapsed;
        }

        private async void LoadAnswerKey()
        {
            if (_busy) return;

            var dialog = new Microsoft.Win32.OpenFileDialog
            {
                Title = "Megoldókulcs (javítási-értékelési útmutató) kiválasztása",
                Filter = "PDF dokumentumok (*.pdf)|*.pdf",
                CheckFileExists = true
            };
            if (dialog.ShowDialog(this) != true) return;

            ApplyForm();
            DraftStore.Save(_draft);

            bool overwrite = false;
            if (_draft.Tasks.Any(HasAnswer))
            {
                var answer = MessageBox.Show(this,
                    "Egyes feladatokhoz már van megoldás.\n\n" +
                    "Igen: felülírom a meglévőket a megoldókulcs adataival.\n" +
                    "Nem: csak az üres mezőket töltöm ki.\n" +
                    "Mégse: kilépek.",
                    "Megoldókulcs betöltése",
                    MessageBoxButton.YesNoCancel,
                    MessageBoxImage.Question);

                if (answer == MessageBoxResult.Cancel) return;
                overwrite = answer == MessageBoxResult.Yes;
            }

            string previousStatus = _keyStatus.Text;
            SetBusy(true, "Feldolgozás folyamatban... ez akár 1-2 percig is eltarthat.");

            try
            {
                byte[] bytes = await File.ReadAllBytesAsync(dialog.FileName);

                var ai = new GeminiService();
                AiAnswerKeyDto key = await ai.ParseAnswerKeyAsync(bytes, _draft);

                // Hibakereséshez: a nyers eredmény a %TEMP% mappában
                File.WriteAllText(
                    Path.Combine(Path.GetTempPath(), "answerkey.json"),
                    System.Text.Json.JsonSerializer.Serialize(key, new System.Text.Json.JsonSerializerOptions
                    {
                        WriteIndented = true,
                        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                    }));

                var result = AnswerKeyMapper.Apply(_draft, key, overwrite);

                _draft.AnswerKeyPdfName = Path.GetFileName(dialog.FileName);
                _draft.AnswerKeyAppliedUtc = DateTime.UtcNow;
                DraftStore.SaveAnswerKeyCopy(_draft, dialog.FileName);
                DraftStore.Save(_draft);

                SetBusy(false, null);
                RefreshKeyStatus();
                RefreshDraftWarnings();
                UpdateRows();
                if (_current != null) LoadForm(_current);
                SetMode(true);   // az áttekintésben egyben látszik minden

                MessageBox.Show(this,
                    $"{result.Filled} feladathoz került új megoldás.\n" +
                    $"{result.Missing} feladathoz nem találtam használható megoldást.\n" +
                    $"{result.WarningCount} figyelmeztetés keletkezett.\n\n" +
                    "A módosított feladatok jóváhagyása visszavonódott, hogy újra átnézhesd őket. " +
                    "Az áttekintésben a feladatok és a megoldásaik egymás mellett látszanak.",
                    "Megoldókulcs betöltve",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                SetBusy(false, previousStatus);
                MessageBox.Show(this, ex.Message, "Megoldókulcs hiba",
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
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

            var sb = new StringBuilder();
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