import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import ContentRow from "@/components/ContentRow";
import { Skeleton } from "@/components/ui/skeleton";
import { tmdbApi, MediaItem } from "@/services/tmdbApi";

type OscarNomination = {
  category: string;
  year: string;
  nominees?: string[];
  movies: Array<{ title: string; tmdb_id?: number | null; imdb_id?: string | null }>;
  won?: boolean | null;
};

type OscarMovieRef = {
  title: string;
  tmdbId?: number | null;
  imdbId?: string | null;
};

type OscarCategoryView = {
  name: string;
  nominees: OscarMovieRef[];
  winners: OscarMovieRef[];
};

const OSCAR_DATA_URL = "https://raw.githubusercontent.com/delventhalz/json-nominations/master/oscar-nominations.json";

const Oscar = () => {
  const currentYear = new Date().getFullYear();
  const minYear = 1980;
  const availableYears = useMemo(
    () => Array.from({ length: currentYear - minYear + 1 }, (_, index) => currentYear - index),
    [currentYear, minYear]
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [nominations, setNominations] = useState<OscarNomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<Record<string, MediaItem[]>>({});

  useEffect(() => {
    let isActive = true;
    const loadNominations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(OSCAR_DATA_URL);
        if (!response.ok) {
          throw new Error("Request failed");
        }
        const data = await response.json();
        if (isActive) {
          setNominations(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isActive) {
          setError("Impossibile caricare i titoli degli Oscar.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadNominations();
    return () => {
      isActive = false;
    };
  }, []);

  const categoriesForYear = useMemo<OscarCategoryView[]>(() => {
    const yearKey = String(selectedYear);
    const fallbackYearKey = String(selectedYear - 1);
    const shouldUseFallbackYear = nominations.length > 0 && !nominations.some((item) => item.year === yearKey);
    const targetYearKey = shouldUseFallbackYear ? fallbackYearKey : yearKey;
    const categoriesMap = new Map<string, { nominees: Map<string, OscarMovieRef>; winners: Map<string, OscarMovieRef> }>();

    nominations.forEach((nomination) => {
      if (nomination.year !== targetYearKey) return;
      const movies = nomination.movies || [];
      if (movies.length === 0) return;
      const entry =
        categoriesMap.get(nomination.category) || {
          nominees: new Map<string, OscarMovieRef>(),
          winners: new Map<string, OscarMovieRef>()
        };
      const getKey = (movie: OscarMovieRef) =>
        movie.tmdbId ? `tmdb:${movie.tmdbId}` : `title:${movie.title.toLowerCase()}`;
      movies.forEach((movie) => {
        if (!movie?.title) return;
        const ref: OscarMovieRef = {
          title: movie.title,
          tmdbId: movie.tmdb_id ?? null,
          imdbId: movie.imdb_id ?? null
        };
        const key = getKey(ref);
        entry.nominees.set(key, ref);
        if (nomination.won) {
          entry.winners.set(key, ref);
        }
      });
      categoriesMap.set(nomination.category, entry);
    });

    return Array.from(categoriesMap.entries())
      .map(([name, data]) => ({
        name,
        nominees: Array.from(data.nominees.values()),
        winners: Array.from(data.winners.values())
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nominations, selectedYear]);

  useEffect(() => {
    let isActive = true;
    const loadCategoryItems = async () => {
      if (categoriesForYear.length === 0) {
        if (isActive) {
          setCategoryItems({});
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      const getKey = (movie: OscarMovieRef) =>
        movie.tmdbId ? `tmdb:${movie.tmdbId}` : `title:${movie.title.toLowerCase()}`;
      const uniqueMovies = new Map<string, OscarMovieRef>();
      categoriesForYear.forEach((category) => {
        category.nominees.forEach((movie) => {
          uniqueMovies.set(getKey(movie), movie);
        });
      });

      try {
        const resolvedEntries = await Promise.all(
          Array.from(uniqueMovies.entries()).map(async ([key, movie]) => {
            if (movie.tmdbId) {
              const details = await tmdbApi.getMovieDetails(String(movie.tmdbId));
              const normalized: MediaItem = {
                ...details,
                media_type: "movie",
                genre_ids: details.genre_ids || details.genres?.map((genre) => genre.id) || []
              };
              return [key, normalized] as const;
            }
            const searchResults = await tmdbApi.search(movie.title);
            const movieResults = searchResults.movies || [];
            const exactMatch = movieResults.find(
              (item) => (item.title || "").toLowerCase() === movie.title.toLowerCase()
            );
            const resolved = exactMatch || movieResults[0] || null;
            return resolved ? ([key, { ...resolved, media_type: "movie" }] as const) : ([key, null] as const);
          })
        );

        if (!isActive) return;

        const resolvedMap = new Map<string, MediaItem | null>(resolvedEntries);
        const nextCategoryItems: Record<string, MediaItem[]> = {};
        categoriesForYear.forEach((category) => {
          const items = category.nominees
            .map((movie) => resolvedMap.get(getKey(movie)))
            .filter((item): item is MediaItem => Boolean(item));
          nextCategoryItems[category.name] = items;
        });

        setCategoryItems(nextCategoryItems);
      } catch (err) {
        if (isActive) {
          setError("Impossibile caricare i titoli degli Oscar.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadCategoryItems();
    return () => {
      isActive = false;
    };
  }, [categoriesForYear]);

  const hasWinnersForYear = categoriesForYear.some((category) => category.winners.length > 0);
  const showWinners = selectedYear < currentYear || hasWinnersForYear;
  const modeLabel = showWinners ? "Candidati e vincitori" : "Candidati";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Oscar" description="Esplora i candidati e i vincitori degli Oscar per anno e categoria." />
      <Navbar />

      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Oscar</h1>
            <p className="text-muted-foreground">Seleziona un anno per vedere {modeLabel.toLowerCase()} per categoria.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>Anno</span>
            </div>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="bg-secondary/30 border border-muted/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <div className="flex gap-4 overflow-hidden">
                  {[1, 2, 3, 4].map((card) => (
                    <Skeleton key={card} className="w-[180px] h-[270px] rounded-md" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {categoriesForYear.length > 0 ? (
              categoriesForYear.map((category) => (
                <div key={category.name} className="border border-muted/30 rounded-lg p-4">
                  {showWinners && category.winners.length > 0 && (
                    <p className="text-sm text-accent mb-3">
                      Vincitore: {category.winners.map((winner) => winner.title).join(", ")}
                    </p>
                  )}
                  {(categoryItems[category.name] || []).length > 0 ? (
                    <ContentRow
                      title={category.name}
                      icon={<Trophy className="text-accent" />}
                      items={categoryItems[category.name] || []}
                      showBadges={true}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nessun titolo disponibile per questa categoria.
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="border border-muted/30 rounded-lg p-6 text-center text-muted-foreground">
                Nessun dato Oscar disponibile per questo anno.
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Oscar;
