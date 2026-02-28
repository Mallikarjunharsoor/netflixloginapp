const express = require("express");
const axios = require("axios");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const omdbBaseUrl = "https://www.omdbapi.com/";

const catalog = [
  { title: "Trending Now", searches: ["Avengers", "Batman", "Dune"] },
  { title: "Top Picks For You", searches: ["Interstellar", "Inception", "Joker"] },
  { title: "Action Blockbusters", searches: ["Mission Impossible", "John Wick", "Mad Max"] },
  { title: "Sci-Fi Worlds", searches: ["Matrix", "Star Wars", "Blade Runner"] },
  { title: "Classic Favorites", searches: ["Godfather", "Shawshank", "Gladiator"] },
];

async function searchMovies(term) {
  const response = await axios.get(omdbBaseUrl, {
    params: {
      apikey: process.env.OMDB_API_KEY,
      s: term,
      page: 1,
    },
    timeout: 10000,
  });

  if (!response.data || response.data.Response === "False") {
    return [];
  }

  return response.data.Search.filter((movie) => movie.Poster && movie.Poster !== "N/A");
}

async function getMovieDetails(imdbID) {
  const response = await axios.get(omdbBaseUrl, {
    params: {
      apikey: process.env.OMDB_API_KEY,
      i: imdbID,
      plot: "full",
    },
    timeout: 10000,
  });
  return response.data;
}

router.get("/home", requireAuth, async (_req, res) => {
  try {
    const rowResults = await Promise.all(
      catalog.map(async (row) => {
        const combined = [];
        for (const term of row.searches) {
          const list = await searchMovies(term);
          combined.push(...list);
        }

        const unique = [];
        const seen = new Set();
        for (const movie of combined) {
          if (!seen.has(movie.imdbID)) {
            seen.add(movie.imdbID);
            unique.push(movie);
          }
        }

        return {
          title: row.title,
          items: unique.slice(0, 14),
        };
      })
    );

    const heroCandidate = rowResults[0]?.items?.[0];
    let hero = null;
    if (heroCandidate) {
      const detailed = await getMovieDetails(heroCandidate.imdbID);
      hero = {
        title: detailed.Title || heroCandidate.Title,
        year: detailed.Year || heroCandidate.Year,
        genre: detailed.Genre || "",
        plot: detailed.Plot || "",
        rating: detailed.imdbRating || "N/A",
        poster: detailed.Poster || heroCandidate.Poster,
      };
    }

    return res.json({ hero, rows: rowResults });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch movie catalog from OMDb.",
      error: error.message,
    });
  }
});

module.exports = router;
