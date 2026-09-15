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
using System.Net.Mail;

namespace TudasterAdmin
{
    public partial class LoginWindow : Window
    {
        public LoginWindow()
        {
            InitializeComponent();

            // Induláskor a gomb legyen kikapcsolva
            LoginButton.IsEnabled = false;

            // Figyeljük a mezők változását
            EmailTextBox.TextChanged += InputChanged;
            PasswordBox.PasswordChanged += InputChanged;

            
        }


        // Ellenőrizzük, hogy a mezők megfelelően ki vannak-e töltve
        private void InputChanged(object sender, RoutedEventArgs e)
        {
            string email = EmailTextBox.Text.Trim();
            string password = PasswordBox.Password;

            bool validEmail = IsValidEmail(email);
            bool validPassword = password.Length >= 6;

            LoginButton.IsEnabled = validEmail && validPassword;

            // Ha újra gépel, eltüntetjük a korábbi hibaüzenetet
            ErrorTextBlock.Visibility = Visibility.Collapsed;
        }


        // E-mail cím ellenőrzése
        private bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                MailAddress address = new MailAddress(email);

                return address.Address == email;
            }
            catch
            {
                return false;
            }
        }


        // Bejelentkezés gomb
        private void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            string email = EmailTextBox.Text.Trim();
            string password = PasswordBox.Password;


            // E-mail ellenőrzése
            if (!IsValidEmail(email))
            {
                ShowError("Kérjük, adj meg egy érvényes e-mail címet!");
                return;
            }


            // Jelszó ellenőrzése
            if (password.Length < 6)
            {
                ShowError("A jelszónak legalább 6 karakter hosszúnak kell lennie!");
                return;
            }


            // ================================
            // SIKERES BEJELENTKEZÉS
            // ================================

            MainWindow mainWindow = new MainWindow();

            mainWindow.Show();

            // Login ablak bezárása
            Close();
        }


        // Hiba megjelenítése
        private void ShowError(string message)
        {
            ErrorTextBlock.Text = message;
            ErrorTextBlock.Visibility = Visibility.Visible;
        }
    }
}