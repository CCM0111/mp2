import axios, { AxiosInstance } from 'axios';
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
  timeout: 60_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type CacheEntry<T> = {
  timestamp: number;
  data: T;
};

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL = 1000 * 60 * 5;

const cacheKey = (url: string, params?: Record<string, unknown>) =>
  JSON.stringify({ url, params });

async function getCached<T>(
  url: string,
  params?: Record<string, unknown>,
  ttl = DEFAULT_TTL,
) {
  const key = cacheKey(url, params);
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const response = await apiClient.get<T>(url, { params });
  cache.set(key, { timestamp: Date.now(), data: response.data });
  return response.data;
}

export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface PokemonSpritesOther {
  dream_world?: {
    front_default: string | null;
  };
  home?: {
    front_default: string | null;
    front_shiny: string | null;
  };
  'official-artwork'?: {
    front_default: string | null;
  };
  [key: string]: unknown;
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  other?: PokemonSpritesOther;
}

export interface PokemonTypeSlot {
  slot: number;
  type: NamedAPIResource;
}

export interface PokemonAbilitySlot {
  ability: NamedAPIResource;
  is_hidden: boolean;
  slot: number;
}

export interface PokemonStatSlot {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
}

export interface PokemonMoveSlot {
  move: NamedAPIResource;
  version_group_details: Array<{
    level_learned_at: number;
    move_learn_method: NamedAPIResource;
    version_group: NamedAPIResource;
  }>;
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  order: number;
  base_experience: number;
  sprites: PokemonSprites;
  types: PokemonTypeSlot[];
  abilities: PokemonAbilitySlot[];
  stats: PokemonStatSlot[];
  moves: PokemonMoveSlot[];
  species: NamedAPIResource;
}

export interface PokemonSpeciesFlavorText {
  flavor_text: string;
  language: NamedAPIResource;
  version: NamedAPIResource;
}

export interface PokemonSpeciesGenus {
  genus: string;
  language: NamedAPIResource;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  color: NamedAPIResource | null;
  habitat: NamedAPIResource | null;
  genera?: PokemonSpeciesGenus[];
  flavor_text_entries: PokemonSpeciesFlavorText[];
  is_legendary: boolean;
  is_mythical: boolean;
  evolution_chain: {
    url: string;
  } | null;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    name: string;
    url: string;
  }>;
}

export interface PokemonSummary {
  id: number;
  name: string;
  sprite: string | null;
  types: string[];
}

export interface PokemonDetail extends PokemonSummary {
  height: number;
  weight: number;
  baseExperience: number;
  abilities: Array<{
    name: string;
    isHidden: boolean;
  }>;
  stats: Array<{
    name: string;
    value: number;
  }>;
  flavorText?: string;
  habitat?: string | null;
  genus?: string | null;
  isLegendary?: boolean;
  isMythical?: boolean;
}

const extractSprite = (pokemon: Pokemon): string | null =>
  pokemon.sprites.other?.['official-artwork']?.front_default ??
  pokemon.sprites.other?.home?.front_default ??
  pokemon.sprites.other?.dream_world?.front_default ??
  pokemon.sprites.front_default ??
  null;

const mapTypes = (types: PokemonTypeSlot[]) =>
  [...types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name);

const mapAbilities = (abilities: PokemonAbilitySlot[]) =>
  [...abilities]
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => ({ name: entry.ability.name, isHidden: entry.is_hidden }));

const mapStats = (stats: PokemonStatSlot[]) =>
  stats.map((entry) => ({ name: entry.stat.name, value: entry.base_stat }));

const sanitizeFlavorText = (text?: string) => text?.replace(/\f|\n|\r/g, ' ');

const extractEnglishFlavor = (species: PokemonSpecies) =>
  sanitizeFlavorText(
    species.flavor_text_entries.find((entry) => entry.language.name === 'en')?.flavor_text,
  );

const extractGenus = (species: PokemonSpecies) =>
  species.genera?.find((entry) => entry.language.name === 'en')?.genus;

const mapToSummary = (pokemon: Pokemon): PokemonSummary => ({
  id: pokemon.id,
  name: pokemon.name,
  sprite: extractSprite(pokemon),
  types: mapTypes(pokemon.types),
});

const mapToDetail = (pokemon: Pokemon, species: PokemonSpecies): PokemonDetail => ({
  ...mapToSummary(pokemon),
  height: pokemon.height,
  weight: pokemon.weight,
  baseExperience: pokemon.base_experience,
  abilities: mapAbilities(pokemon.abilities),
  stats: mapStats(pokemon.stats),
  flavorText: extractEnglishFlavor(species),
  habitat: species.habitat?.name ?? null,
  genus: extractGenus(species) ?? null,
  isLegendary: species.is_legendary,
  isMythical: species.is_mythical,
});

const fetchPokemonList = (limit = 1000, offset = 0) =>
  getCached<PokemonListResponse>('/pokemon', { limit, offset });

const fetchPokemonByNameOrId = (nameOrId: string | number) =>
  getCached<Pokemon>(`/pokemon/${nameOrId}`);

const fetchPokemonSpeciesByNameOrId = (nameOrId: string | number) =>
  getCached<PokemonSpecies>(`/pokemon-species/${nameOrId}`);

const fetchPokemonSummary = async (nameOrId: string | number) => {
  const pokemon = await fetchPokemonByNameOrId(nameOrId);
  return mapToSummary(pokemon);
};

const fetchPokemonDetail = async (nameOrId: string | number) => {
  const [pokemon, species] = await Promise.all([
    fetchPokemonByNameOrId(nameOrId),
    fetchPokemonSpeciesByNameOrId(nameOrId),
  ]);
  return mapToDetail(pokemon, species);
};

interface ListParams {
  limit: number;
  offset: number;
}

interface PokemonContextValue {
  list: PokemonSummary[];
  totalCount: number;
  isListLoading: boolean;
  listError?: string;
  listParams: ListParams;
  summariesById: Record<number, PokemonSummary>;
  detailsById: Record<number, PokemonDetail>;
  loadList: (limit?: number, offset?: number) => Promise<void>;
  getSummary: (idOrName: number | string) => Promise<PokemonSummary>;
  getDetail: (idOrName: number | string) => Promise<PokemonDetail>;
}

const PokemonContext = createContext<PokemonContextValue | undefined>(undefined);

const extractErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong while talking to PokéAPI.';
};

export const PokemonProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [list, setList] = useState<PokemonSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isListLoading, setIsListLoading] = useState(false);
  const [listError, setListError] = useState<string | undefined>();
  const [listParams, setListParams] = useState<ListParams>({ limit: 1000, offset: 0 });
  const [summariesById, setSummariesById] = useState<Record<number, PokemonSummary>>({});
  const [detailsById, setDetailsById] = useState<Record<number, PokemonDetail>>({});

  const loadList = useCallback(async (limit = 1000, offset = 0) => {
    // 如果已经有数据，直接返回不做任何操作
    if (list.length > 0) {
      return;
    }

    setIsListLoading(true);
    setListError(undefined);
    setListParams({ limit, offset });
    try {
      const response = await fetchPokemonList(limit, offset);
      const summaries = await Promise.all(
        response.results.map((result) => fetchPokemonSummary(result.name)),
      );

      setList(summaries);
      setTotalCount(response.count);
      setSummariesById((prev) => {
        const next = { ...prev };
        summaries.forEach((summary) => {
          next[summary.id] = summary;
        });
        return next;
      });
    } catch (error) {
      setListError(extractErrorMessage(error));
    } finally {
      setIsListLoading(false);
    }
  }, [list.length]);

  const getSummary = useCallback(async (idOrName: number | string) => {
    const summary = await fetchPokemonSummary(idOrName);
    setSummariesById((prev) => ({ ...prev, [summary.id]: summary }));
    return summary;
  }, []);

  const getDetail = useCallback(async (idOrName: number | string) => {
    const detail = await fetchPokemonDetail(idOrName);
    setDetailsById((prev) => ({ ...prev, [detail.id]: detail }));
    setSummariesById((prev) => ({ ...prev, [detail.id]: detail }));
    return detail;
  }, []);

  const value = useMemo(
    () => ({
      list,
      totalCount,
      isListLoading,
      listError,
      listParams,
      summariesById,
      detailsById,
      loadList,
      getSummary,
      getDetail,
    }),
    [
      list,
      totalCount,
      isListLoading,
      listError,
      listParams,
      summariesById,
      detailsById,
      loadList,
      getSummary,
      getDetail,
    ],
  );

  return <PokemonContext.Provider value={value}>{children}</PokemonContext.Provider>;
};

export const usePokemonData = () => {
  const context = useContext(PokemonContext);
  if (!context) {
    throw new Error('usePokemonData must be used within a PokemonProvider');
  }
  return context;
};
