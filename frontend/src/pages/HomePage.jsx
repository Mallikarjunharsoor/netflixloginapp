import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { clearSession, getStoredUser } from "../utils/auth";

function HomePage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState({ hero: null, rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = getStoredUser();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.fetchCatalog();
        if (mounted) {
          setCatalog(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return <main className="home-page auth-page">Loading your Netflix home...</main>;
  }

  if (error) {
    return (
      <main className="home-page auth-page">
        <section className="auth-card">
          <h2>Unable to load catalog</h2>
          <p className="error-text">{error}</p>
          <button onClick={handleLogout}>Back to Login</button>
        </section>
      </main>
    );
  }

  const heroImage =
    catalog.hero?.poster && catalog.hero.poster !== "N/A"
      ? catalog.hero.poster
      : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80";

  return (
    <main className="home-page">
      <header className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero-overlay" />
        <nav className="top-nav">
          <h1>NETFLIX</h1>
          <button onClick={handleLogout}>Logout</button>
        </nav>
        <div className="hero-inner">
          <p>{user?.name ? `Welcome, ${user.name}` : "Welcome back"}</p>
          <h2>{catalog.hero?.title || "Featured Movie"}</h2>
          <p>
            {catalog.hero?.year ? `${catalog.hero.year} | ` : ""}
            {catalog.hero?.genre || "Drama"} | IMDb {catalog.hero?.rating || "N/A"}
          </p>
          <p>{catalog.hero?.plot || "Browse and watch trending titles now."}</p>
        </div>
      </header>

      <section className="rows">
        {catalog.rows.map((row) => (
          <article className="movie-row" key={row.title}>
            <h3>{row.title}</h3>
            <div className="card-strip">
              {row.items.map((movie) => (
                <div className="movie-card" key={movie.imdbID}>
                  <img src={movie.Poster} alt={movie.Title} loading="lazy" />
                  <div className="movie-meta">
                    <div>{movie.Title}</div>
                    <small>{movie.Year}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default HomePage;
