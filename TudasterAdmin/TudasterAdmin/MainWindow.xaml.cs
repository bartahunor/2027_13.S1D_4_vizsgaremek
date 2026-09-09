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
using TudasterAdmin.Views;

namespace TudasterAdmin
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();

            ShowDashboard();
        }


        private void Dashboard_Click(
            object sender,
            RoutedEventArgs e)
        {
            ShowDashboard();
        }


        private void Import_Click(
            object sender,
            RoutedEventArgs e)
        {
            ShowImport();
        }


        private void Processor_Click(
            object sender,
            RoutedEventArgs e)
        {
            ShowProcessor();
        }


        private void Review_Click(
            object sender,
            RoutedEventArgs e)
        {
            MessageBox.Show("Ellenőrzés oldal");
        }


        private void Tasks_Click(
            object sender,
            RoutedEventArgs e)
        {
            MessageBox.Show("Feladatbázis oldal");
        }


        private void Users_Click(
            object sender,
            RoutedEventArgs e)
        {
            MessageBox.Show("Felhasználói statisztika");
        }


        private void Practice_Click(
            object sender,
            RoutedEventArgs e)
        {
            MessageBox.Show("Gyakorlási statisztika");
        }


        private void ShowDashboard()
        {
            ContentArea.Children.Clear();

            ContentArea.Children.Add(
                new DashboardView());
        }


        private void ShowImport()
        {
            ContentArea.Children.Clear();

            ContentArea.Children.Add(
                new ImportView());
        }


        private void ShowProcessor()
        {
            ContentArea.Children.Clear();

            ContentArea.Children.Add(
                new ProcessorView());
        }
    }
}