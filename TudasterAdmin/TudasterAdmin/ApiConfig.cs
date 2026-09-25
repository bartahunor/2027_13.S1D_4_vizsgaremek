namespace TudasterAdmin
{
    // ================================
    // Közös API beállítások
    // ================================
    // Egyetlen helyen tartjuk a backend URL-t, hogy LoginWindow és
    // MainWindow (és a jövőbeli ablakok) is ugyanazt használják.
    public static class ApiConfig
    {
        // A profilroutes.js / adminroutes.js mountolási helye a szervereden,
        // pl. app.use('/api/admin', adminRoutes) esetén '.../api'.
        public const string BackendApiUrl = "http://localhost:3000/api";
    }
}