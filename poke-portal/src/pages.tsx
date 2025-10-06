import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PokemonDetail, usePokemonData } from './pokemonData';

const formatPokemonName = (name: string) =>
  name
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const formatTypeLabel = (type: string) => type.charAt(0).toUpperCase() + type.slice(1);
const formatDexNumber = (id: number) => `#${id.toString().padStart(3, '0')}`;
const formatHeightMeters = (heightDecimeters: number) => `${(heightDecimeters / 10).toFixed(1)} m`;
const formatWeightKilograms = (weightHectograms: number) => `${(weightHectograms / 10).toFixed(1)} kg`;
const MAX_STAT_VALUE = 255;

export const ListPage: React.FC = () => {
  const { list, isListLoading, listError, loadList } = usePokemonData();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      if (list.length === 0 && !isListLoading) {
        void loadList();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'name'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSorted = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    const filtered = lowerQuery
      ? list.filter((pokemon) => pokemon.name.toLowerCase().includes(lowerQuery))
      : list;

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = a.id - b.id;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [list, query, sortBy, sortOrder]);

  return (
    <section className="page list-page">
      <header className="page-header">
        <h2>Pokemon List</h2>
        <p>Search and sort Pokemon</p>
      </header>
      <div className="list-controls">
        <label className="list-controls__search" htmlFor="search">
          <span className="visually-hidden">Search Pokémon</span>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name…"
            autoComplete="off"
          />
        </label>
        <div className="list-controls__sort">
          <label htmlFor="sort-by">Sort by</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'id' | 'name')}
          >
            <option value="id">ID</option>
            <option value="name">Name</option>
          </select>
        </div>
        <div className="list-controls__order">
          <label htmlFor="sort-order">Order</label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
      {listError && <p className="error-banner">{listError}</p>}
      {!listError && list.length > 0 && (
        <p className="list-meta">
          Showing {filteredAndSorted.length} of {list.length} Pokemon
        </p>
      )}
      {filteredAndSorted.length === 0 && list.length === 0 ? (
        <p className="empty-state">Loading Pokemon...</p>
      ) : filteredAndSorted.length === 0 ? (
        <p className="empty-state">No Pokemon found.</p>
      ) : (
        <ul className="pokemon-grid">
          {filteredAndSorted.map((pokemon) => (
            <li key={pokemon.id} className="pokemon-grid__item">
              <Link to={`/pokemon/${pokemon.id}`} className="pokemon-card">
                <div className="pokemon-card__media" aria-hidden>
                  {pokemon.sprite ? (
                    <img src={pokemon.sprite} alt="" loading="lazy" />
                  ) : (
                    <div className="pokemon-card__placeholder" />
                  )}
                </div>
                <div className="pokemon-card__body">
                  <h3>{formatPokemonName(pokemon.name)}</h3>
                  <p className="pokemon-card__types">
                    {pokemon.types.length ? pokemon.types.join(' · ') : 'Unknown types'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const GalleryPage: React.FC = () => {
  const { list, isListLoading, listError, loadList } = usePokemonData();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      if (list.length === 0 && !isListLoading) {
        void loadList();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allTypes = useMemo(() => {
    const unique = new Set<string>();
    list.forEach((pokemon) => {
      pokemon.types.forEach((type) => unique.add(type));
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [list]);

  const filtered = useMemo(() => {
    if (!selectedTypes.length) return list;
    return list.filter((pokemon) => selectedTypes.every((type) => pokemon.types.includes(type)));
  }, [list, selectedTypes]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((value) => value !== type) : [...prev, type],
    );
  };

  return (
    <section className="page gallery-page">
      <header className="page-header">
        <h2>Gallery</h2>
        <p>Filter Pokemon by type</p>
      </header>
      <div className="gallery-controls">
        <h3>Filter by type</h3>
        <div className="type-filters" role="group" aria-label="Filter by Pokémon type">
          {allTypes.map((type) => {
            const isActive = selectedTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                className={`type-chip${isActive ? ' type-chip--active' : ''}`}
                onClick={() => toggleType(type)}
                aria-pressed={isActive}
              >
                {formatTypeLabel(type)}
              </button>
            );
          })}
        </div>
        <div className="gallery-controls__footer">
          <p className="gallery-meta">
            {selectedTypes.length
              ? `Found ${filtered.length} Pokemon`
              : `Total ${list.length} Pokemon`}
          </p>
          {selectedTypes.length > 0 && (
            <button type="button" className="clear-filters" onClick={() => setSelectedTypes([])}>
              Clear filters
            </button>
          )}
        </div>
      </div>
      {listError && <p className="error-banner">{listError}</p>}
      {filtered.length === 0 && list.length === 0 ? (
        <p className="empty-state">Loading Pokemon...</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No Pokemon found.</p>
      ) : (
        <ul className="gallery-grid">
          {filtered.map((pokemon) => (
            <li key={pokemon.id} className="gallery-grid__item">
              <Link to={`/pokemon/${pokemon.id}`} className="gallery-card">
                <div className="gallery-card__media" aria-hidden>
                  {pokemon.sprite ? (
                    <img src={pokemon.sprite} alt="" loading="lazy" />
                  ) : (
                    <div className="gallery-card__placeholder" />
                  )}
                </div>
                <div className="gallery-card__body">
                  <h3>{formatPokemonName(pokemon.name)}</h3>
                  <p className="gallery-card__types">
                    {pokemon.types.length ? pokemon.types.join(' · ') : 'Unknown types'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const DetailPage: React.FC = () => {
  const { idOrName } = useParams<{ idOrName: string }>();
  const navigate = useNavigate();
  const { getDetail, list } = usePokemonData();

  const [detail, setDetail] = useState<PokemonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!idOrName) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(undefined);

    void getDetail(idOrName)
      .then((data) => {
        if (isMounted) setDetail(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load Pokémon details right now.');
          setDetail(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idOrName, getDetail]);

  const currentIndex = useMemo(() => {
    if (!detail || !list.length) return -1;
    return list.findIndex((pokemon) => pokemon.id === detail.id);
  }, [detail, list]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < list.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      const previous = list[currentIndex - 1];
      navigate(`/pokemon/${previous.id}`);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      const next = list[currentIndex + 1];
      navigate(`/pokemon/${next.id}`);
    }
  };

  return (
    <section className="page detail-page">
      <header className="page-header detail-header">
        <div>
          <h2>Pokemon Details</h2>
        </div>
        <nav className="detail-nav" aria-label="Pokémon navigation">
          <button
            type="button"
            className="detail-nav__button"
            onClick={goToPrevious}
            disabled={!hasPrevious}
            aria-label="Previous Pokémon"
          >
            ← Previous
          </button>
          <Link 
            to="/list"
            className="detail-nav__button detail-nav__button--link"
          >
            Back to List
          </Link>
          <button
            type="button"
            className="detail-nav__button"
            onClick={goToNext}
            disabled={!hasNext}
            aria-label="Next Pokémon"
          >
            Next →
          </button>
        </nav>
      </header>

      {error && <p className="error-banner">{error}</p>}
      {detail ? (
        <article className="detail-card">
          <div className="detail-hero">
            <div className="detail-portrait" aria-hidden={!detail.sprite}>
              {detail.sprite ? (
                <img src={detail.sprite} alt={`${formatPokemonName(detail.name)} artwork`} />
              ) : (
                <div className="detail-portrait__placeholder" />
              )}
            </div>
            <div className="detail-summary">
              <div className="detail-summary__header">
                <span className="detail-dex">{formatDexNumber(detail.id)}</span>
                <h3>{formatPokemonName(detail.name)}</h3>
              </div>
              {detail.genus && <p className="detail-genus">{detail.genus}</p>}
              {detail.flavorText && <p className="detail-flavor">{detail.flavorText}</p>}
              <div className="detail-tags">
                {detail.types.map((type) => (
                  <span key={type} className="detail-tag">
                    {formatTypeLabel(type)}
                  </span>
                ))}
                {detail.isLegendary && <span className="detail-tag detail-tag--accent">Legendary</span>}
                {detail.isMythical && <span className="detail-tag detail-tag--accent">Mythical</span>}
              </div>
              <dl className="detail-facts">
                <div>
                  <dt>Height</dt>
                  <dd>{formatHeightMeters(detail.height)}</dd>
                </div>
                <div>
                  <dt>Weight</dt>
                  <dd>{formatWeightKilograms(detail.weight)}</dd>
                </div>
                <div>
                  <dt>Habitat</dt>
                  <dd>{detail.habitat ? formatTypeLabel(detail.habitat) : 'Unknown'}</dd>
                </div>
                <div>
                  <dt>Base experience</dt>
                  <dd>{detail.baseExperience.toString()}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="detail-sections">
            <section className="detail-section">
              <h4>Abilities</h4>
              <ul className="detail-abilities">
                {detail.abilities.map((ability) => (
                  <li key={ability.name}>
                    <span>{formatTypeLabel(ability.name)}</span>
                    {ability.isHidden && <span className="detail-ability-hidden">Hidden</span>}
                  </li>
                ))}
              </ul>
            </section>

            <section className="detail-section">
              <h4>Stats</h4>
              <ul className="detail-stats">
                {detail.stats.map((stat) => {
                  const percent = Math.min(100, Math.round((stat.value / MAX_STAT_VALUE) * 100));
                  return (
                    <li key={stat.name}>
                      <div className="stat-label-row">
                        <span>{formatTypeLabel(stat.name)}</span>
                        <span className="stat-value">{stat.value}</span>
                      </div>
                      <div className="stat-bar" role="presentation">
                        <span className="stat-bar__fill" style={{ width: `${percent}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </article>
      ) : !error ? (
        <p className="empty-state">Loading Pokemon details...</p>
      ) : null}
    </section>
  );
};

export const NotFoundPage: React.FC = () => (
  <section className="page not-found-page">
    <header className="page-header">
      <h2>404 - Page Not Found</h2>
    </header>
    <p>
      <Link to="/list">Back to List</Link>
    </p>
  </section>
);
