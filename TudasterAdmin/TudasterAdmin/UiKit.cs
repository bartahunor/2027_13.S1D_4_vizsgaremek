using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace TudasterAdmin
{
    internal enum BtnKind { Primary, Secondary, Outline, Danger }

    internal static class UiKit
    {
        // ---------- Erőforrások ----------
        public static Brush Res(string key) => (Brush)Application.Current.FindResource(key);

        // ---------- Gombok ----------
        public static Button Button(string text, BtnKind kind = BtnKind.Primary,
                                    double width = double.NaN, double height = 42,
                                    double fontSize = 13)
        {
            var b = new Button
            {
                Content = text,
                Height = height,
                FontSize = fontSize,
                FontWeight = FontWeights.SemiBold,
                Cursor = Cursors.Hand,
                Padding = new Thickness(18, 0, 18, 0),
                Template = UiStyles.Button
            };
            if (!double.IsNaN(width)) b.Width = width;

            switch (kind)
            {
                case BtnKind.Primary:
                    b.Background = Res("PrimaryBrush");
                    b.Foreground = Brushes.White;
                    b.BorderThickness = new Thickness(0);
                    break;
                case BtnKind.Secondary:
                    b.Background = Res("PrimaryLightBrush");
                    b.Foreground = Brushes.White;
                    b.BorderThickness = new Thickness(0);
                    break;
                case BtnKind.Danger:
                    b.Background = Brushes.Firebrick;
                    b.Foreground = Brushes.White;
                    b.BorderThickness = new Thickness(0);
                    break;
                default: // Outline
                    b.Background = Brushes.White;
                    b.Foreground = Res("TextBrush");
                    b.BorderBrush = Res("BorderBrush");
                    b.BorderThickness = new Thickness(1);
                    break;
            }
            return b;
        }

        public static Button DeleteButton(string text = "TÖRLÉS", double width = 100, double height = 36)
        {
            var b = Button(text, BtnKind.Danger, width, height, 12);
            b.VerticalAlignment = VerticalAlignment.Center;
            return b;
        }

        // ---------- Legördülő ----------
        public static ComboBox Combo(double width = double.NaN, double height = double.NaN,
                                     bool boxed = true, double fontSize = 13)
        {
            var c = new ComboBox
            {
                FontSize = fontSize,
                Cursor = Cursors.Hand,
                VerticalContentAlignment = VerticalAlignment.Center,
                Padding = new Thickness(12, 0, 30, 0),
                Template = UiStyles.Combo,
                ItemContainerStyle = UiStyles.ComboItem
            };
            if (!double.IsNaN(width)) c.Width = width;
            if (!double.IsNaN(height)) c.Height = height;

            if (boxed)   // önálló, keretes legördülő
            {
                c.Background = Brushes.White;
                c.BorderBrush = Res("BorderBrush");
                c.BorderThickness = new Thickness(1);
            }
            else         // már keretes dobozban van (pl. BoxedLine)
            {
                c.Background = Brushes.Transparent;
                c.BorderThickness = new Thickness(0);
                c.Padding = new Thickness(0, 0, 26, 0);
            }
            return c;
        }

        // ---------- Szövegmezők ----------
        public static TextBox Text(double fontSize = 13) => new TextBox
        {
            BorderThickness = new Thickness(0),
            Background = Brushes.Transparent,
            FontSize = fontSize,
            VerticalContentAlignment = VerticalAlignment.Center
        };

        public static TextBox MultiLine(double minHeight) => new TextBox
        {
            BorderThickness = new Thickness(0),
            Background = Brushes.Transparent,
            FontSize = 13,
            AcceptsReturn = true,
            TextWrapping = TextWrapping.Wrap,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            MinHeight = minHeight
        };

        // Keretes egysoros doboz (szöveg / legördülő köré)
        public static Border BoxedLine(FrameworkElement inner, double width, double height = 44) => new Border
        {
            Width = width,
            Height = height,
            Background = Brushes.White,
            BorderBrush = Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12, 0, 12, 0),
            Child = inner
        };

        public static Border BoxedArea(FrameworkElement inner) => new Border
        {
            Background = Brushes.White,
            BorderBrush = Res("BorderBrush"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12, 8, 12, 8),
            Child = inner
        };

        // ---------- Placeholderes mező ----------
        public static (Grid Host, TextBox Box, TextBlock Placeholder) PlaceholderBox(
            string placeholder, double fontSize = 14, Thickness? padding = null, double width = double.NaN)
        {
            var box = new TextBox
            {
                FontSize = fontSize,
                Padding = padding ?? new Thickness(12, 0, 12, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                VerticalContentAlignment = VerticalAlignment.Center
            };
            if (!double.IsNaN(width)) box.Width = width;

            var ph = new TextBlock
            {
                Text = placeholder,
                FontSize = fontSize,
                Foreground = Res("MutedTextBrush"),
                Margin = new Thickness(14, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                IsHitTestVisible = false
            };

            box.TextChanged += (s, e) =>
                ph.Visibility = string.IsNullOrEmpty(box.Text) ? Visibility.Visible : Visibility.Collapsed;

            var host = new Grid();
            host.Children.Add(box);
            host.Children.Add(ph);
            return (host, box, ph);
        }

        // ---------- Kereső (minden oldalon ugyanaz) ----------
        public static (Border Control, TextBox Box) SearchBox(Action? onChanged = null, double width = 320)
        {
            var (host, box, _) = PlaceholderBox("Keresés...");
            if (onChanged != null) box.TextChanged += (s, e) => onChanged();

            var border = new Border
            {
                Height = 42,
                Width = width,
                Background = Brushes.White,
                BorderBrush = Res("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                HorizontalAlignment = HorizontalAlignment.Left,
                VerticalAlignment = VerticalAlignment.Top,
                Child = host
            };
            return (border, box);
        }

        // ---------- "Új elem hozzáadása" doboz (szövegmező + lila gomb) ----------
        public static (Border Control, TextBox Input, Button Add, TextBlock Placeholder) AddBox(
            string placeholder, Action onAdd)
        {
            var (host, input, ph) = PlaceholderBox(placeholder, 14, new Thickness(10, 0, 10, 0), 230);
            ph.Margin = new Thickness(12, 0, 0, 0);

            var add = Button("+  HOZZÁADÁS", BtnKind.Primary, 132, 42);
            add.Click += (s, e) => onAdd();
            input.KeyDown += (s, e) =>
            {
                if (e.Key == Key.Enter) { onAdd(); e.Handled = true; }
            };

            var inner = new StackPanel { Orientation = Orientation.Horizontal };
            inner.Children.Add(host);
            inner.Children.Add(add);

            var border = new Border
            {
                Height = 42,
                Background = Brushes.White,
                BorderBrush = Res("PrimaryBrush"),
                BorderThickness = new Thickness(1.5),
                CornerRadius = new CornerRadius(10),
                HorizontalAlignment = HorizontalAlignment.Right,
                Child = inner
            };
            return (border, input, add, ph);
        }

        // Felső sáv: bal oldalt kereső, jobb oldalt tetszőleges elem
        public static Grid Toolbar(UIElement left, UIElement? right = null, double bottom = 20)
        {
            var g = new Grid { Margin = new Thickness(0, 0, 0, bottom) };
            g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            g.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            Grid.SetColumn(left, 0);
            g.Children.Add(left);
            if (right != null)
            {
                Grid.SetColumn(right, 1);
                g.Children.Add(right);
            }
            return g;
        }

        // ---------- Kártyák ----------
        // Fehér kártya címmel (beállítások, szerkesztő)
        public static Border Card(string? title, params UIElement[] children)
        {
            var panel = new StackPanel();
            if (title != null)
                panel.Children.Add(new TextBlock
                {
                    Text = title,
                    FontSize = 16,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = Res("TextBrush"),
                    Margin = new Thickness(0, 0, 0, 14)
                });
            foreach (var c in children) panel.Children.Add(c);

            return new Border
            {
                Background = Brushes.White,
                BorderBrush = Res("BorderBrush"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(14),
                Padding = new Thickness(22),
                Margin = new Thickness(0, 0, 0, 16),
                Child = panel
            };
        }

        // Listasor: bal oldalt tartalom, jobb oldalt gombok (tantárgy, típus, felhasználó, témakör)
        public static Border ListCard(UIElement info, params UIElement[] actions)
        {
            var row = new Grid();
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            Grid.SetColumn(info, 0);
            row.Children.Add(info);

            var buttons = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                VerticalAlignment = VerticalAlignment.Center
            };
            foreach (var a in actions) buttons.Children.Add(a);
            Grid.SetColumn(buttons, 1);
            row.Children.Add(buttons);

            return new Border
            {
                Background = Brushes.White,
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(20),
                Margin = new Thickness(0, 0, 0, 12),
                Child = row
            };
        }

        // Cím + alcím (+ opcionális szín) a listasorokhoz
        public static StackPanel TitleDetail(string title, string? detail = null,
                                             Brush? detailBrush = null, double titleSize = 18)
        {
            var p = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
            p.Children.Add(new TextBlock
            {
                Text = title,
                FontSize = titleSize,
                FontWeight = FontWeights.SemiBold,
                Foreground = Res("TextBrush")
            });
            if (!string.IsNullOrEmpty(detail))
                p.Children.Add(new TextBlock
                {
                    Text = detail,
                    FontSize = 14,
                    Foreground = detailBrush ?? Res("MutedTextBrush"),
                    Margin = new Thickness(0, 5, 0, 0)
                });
            return p;
        }

        public static TextBlock EmptyText(string text) => new TextBlock
        {
            Text = text,
            Foreground = Res("MutedTextBrush")
        };

        // Címke + mező (szerkesztő űrlap)
        public static StackPanel Field(string label, FrameworkElement box, double right = 14)
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

        // Görgethető oldaltartalom
        public static ScrollViewer Page(UIElement content) => new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Content = content
        };
    }
}