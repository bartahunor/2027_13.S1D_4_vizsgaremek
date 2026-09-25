using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace TudasterAdmin
{
    public partial class LoginWindow : Window
    {
        // Egyetlen közös HttpClient példány (ne hozz létre újat minden híváshoz)
        private static readonly HttpClient _httpClient = new HttpClient();

        // ================================
        // Supabase projekt beállítások
        // ================================
        // Cseréld ki a saját projekted URL-jére és anon (public) kulcsára.
        // Ezek ugyanazok az értékek, amiket a webappodban is használsz.
        private const string SupabaseUrl = "https://rbjynupbmxbfncqbfpxw.supabase.co";
        private const string SupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJianludXBibXhiZm5jcWJmcHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzMxNjMsImV4cCI6MjA4NjIwOTE2M30.PMPIbEXQq7gxWv5__LW8LJIEPzAbmZNFlLOArdZ4Wc0";

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
        private async void LoginButton_Click(object sender, RoutedEventArgs e)
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

            // UI letiltása a hívás idejére
            LoginButton.IsEnabled = false;
            string originalContent = LoginButton.Content?.ToString();
            LoginButton.Content = "Bejelentkezés...";

            try
            {
                SupabaseAuthResponse authResult = await SupabaseLoginAsync(email, password);

                if (authResult == null)
                {
                    ShowError("Hibás e-mail cím vagy jelszó!");
                    return;
                }

                // Token(ek) és felhasználó adatok elmentése, hogy a backend
                // hívásoknál Authorization: Bearer fejlécként tudd használni.
                SessionStore.AccessToken = authResult.AccessToken;
                SessionStore.RefreshToken = authResult.RefreshToken;
                SessionStore.UserId = authResult.User?.Id;
                SessionStore.UserEmail = authResult.User?.Email;

                // ================================
                // ADMIN JOGOSULTSÁG ELLENŐRZÉSE
                // ================================
                // A Supabase login önmagában csak azt igazolja, hogy létező
                // felhasználó vagyunk érvényes jelszóval - ez még nem admin jog.
                // Ezért megkérdezzük a saját backendünket is.
                bool isAdmin = await CheckIsAdminAsync(authResult.AccessToken);

                if (!isAdmin)
                {
                    // Nem admin felhasználó - nem engedjük be az admin felületre.
                    // A tokent is töröljük, hiszen erre a sessionre itt nincs szükség.
                    SessionStore.Clear();
                    ShowError("Ehhez a fiókhoz nincs admin jogosultság!");
                    return;
                }

                // ================================
                // SIKERES BEJELENTKEZÉS + ADMIN JOGOSULTSÁG
                // ================================

                MainWindow mainWindow = new MainWindow();
                mainWindow.Show();

                // Login ablak bezárása
                Close();
            }
            catch (HttpRequestException)
            {
                ShowError("Nem sikerült kapcsolódni a szerverhez. Ellenőrizd az internetkapcsolatot!");
            }
            catch (Exception ex)
            {
                ShowError("Váratlan hiba történt: " + ex.Message);
            }
            finally
            {
                LoginButton.IsEnabled = true;
                LoginButton.Content = originalContent ?? "Bejelentkezés";
            }
        }

        // Supabase Auth REST hívás: email + jelszó alapú bejelentkezés
        private async Task<SupabaseAuthResponse> SupabaseLoginAsync(string email, string password)
        {
            string url = $"{SupabaseUrl}/auth/v1/token?grant_type=password";

            var payload = new
            {
                email,
                password
            };

            string json = JsonSerializer.Serialize(payload);

            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("apikey", SupabaseAnonKey);

            HttpResponseMessage response = await _httpClient.SendAsync(request);
            string responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                // Hibás belépés esetén a Supabase 400-at ad vissza,
                // pl. {"error":"invalid_grant","error_description":"Invalid login credentials"}
                return null;
            }

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            return JsonSerializer.Deserialize<SupabaseAuthResponse>(responseBody, options);
        }

        // Saját backend hívás: megkérdezzük, hogy a bejelentkezett felhasználó admin-e
        private async Task<bool> CheckIsAdminAsync(string accessToken)
        {
            string url = $"{ApiConfig.BackendApiUrl}/adminroutes/checkadmin";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);

            // Ugyanazt a Supabase access tokent küldjük tovább, amit a bejelentkezéskor kaptunk.
            // A backend requireAuth middleware-je ebből azonosítja a felhasználót.
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            HttpResponseMessage response = await _httpClient.SendAsync(request);
            string responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                // pl. 401 = érvénytelen/lejárt token, 404 = nincs profil sor a userhez
                throw new Exception($"Admin ellenőrzés sikertelen ({(int)response.StatusCode}): {responseBody}");
            }

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var result = JsonSerializer.Deserialize<IsAdminResponse>(responseBody, options);

            return result?.IsAdmin ?? false;
        }

        // Hiba megjelenítése
        private void ShowError(string message)
        {
            ErrorTextBlock.Text = message;
            ErrorTextBlock.Visibility = Visibility.Visible;
        }
    }

    // ================================
    // Supabase auth válasz modellje
    // ================================
    public class SupabaseAuthResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; }

        [JsonPropertyName("token_type")]
        public string TokenType { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; set; }

        [JsonPropertyName("user")]
        public SupabaseUser User { get; set; }
    }

    public class SupabaseUser
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; }
    }

    // ================================
    // Saját backend /me/is-admin válaszának modellje
    // ================================
    public class IsAdminResponse
    {
        [JsonPropertyName("isAdmin")]
        public bool IsAdmin { get; set; }
    }

    // ================================
    // Egyszerű, alkalmazás-szintű session tároló
    // ================================
    // Ide kerül a bejelentkezés után kapott token, amit aztán
    // minden backend hívásnál Authorization: Bearer {AccessToken}
    // fejlécként kell elküldened.
    public static class SessionStore
    {
        public static string AccessToken { get; set; }
        public static string RefreshToken { get; set; }
        public static string UserId { get; set; }
        public static string UserEmail { get; set; }

        // Session törlése - pl. amikor a bejelentkezés sikeres volt,
        // de a felhasználó nem admin, így nem kapott hozzáférést.
        public static void Clear()
        {
            AccessToken = null;
            RefreshToken = null;
            UserId = null;
            UserEmail = null;
        }
    }
}