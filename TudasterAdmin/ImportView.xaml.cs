using Microsoft.Win32;
using System.Windows;
using System.Windows.Controls;

namespace TudasterAdmin.Views
{
    public partial class ImportView : UserControl
    {
        public ImportView()
        {
            InitializeComponent();
        }

        private void SelectPdf_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog dialog = new OpenFileDialog
            {
                Filter = "PDF fájlok (*.pdf)|*.pdf",
                Title = "Érettségi PDF kiválasztása"
            };

            if (dialog.ShowDialog() == true)
            {
                FileNameText.Text = dialog.FileName;
            }
        }
    }
}