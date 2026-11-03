
import gameData from "../../richi3f/static/js/games.js";
import pokemonData from "../../richi3f/static/js/pokemon.js";
import dexData from "../../richi3f/static/js/dexes.js";
import typeData from "../../richi3f/static/js/types.js";

export { gameData, pokemonData, dexData, typeData };

const pokemonIndex = new Map(
    Object.values(pokemonData).map(pokemon => [
        `${pokemon.base_id}-${pokemon.form_id}`,
        pokemon
    ])
);

export function getAvailableGames() {
    return Object.entries(gameData)
        .filter(([slug, game]) => !game.disabled && slug !== "home")
        .map(([slug, game]) => ({
            slug,
            name: game.name ?? `Pokémon ${game.versions.map(version => version.name).join(" / ")}`,
            generation: game.gen,
            dexSlugs: game.dex_slugs,
            hasMegaEvolutions: Boolean(game.mega)
        }));
}

export function getGamePokemon(gameSlug) {
    const game = gameData[gameSlug];

    if (!game) {
        throw new Error(`Unknown game: ${gameSlug}`);
    }

    const pokemonById = new Map();

    for (const dexSlug of game.dex_slugs) {
        const dex = dexData[dexSlug];

        if (!dex) {
            continue;
        }

        for (const entries of Object.values(dex.order)) {
            for (const [baseId, formId] of entries) {
                const key = `${baseId}-${formId}`;
                const pokemon = pokemonIndex.get(key);

                if (pokemon) {
                    pokemonById.set(key, pokemon);
                }
            }
        }
    }

    return [...pokemonById.values()];
}

export function getTypeChartForGeneration(generation) {
    const chart = typeData
        .filter(entry => entry.generation <= generation)
        .sort((a, b) => b.generation - a.generation)[0];

    if (!chart) {
        throw new Error(`No type chart available for generation ${generation}`);
    }

    return chart.type_data;
}

export function getPokemonTypes(pokemon, generation) {
    if (
        pokemon.past_type &&
        generation < pokemon.past_type.generation
    ) {
        return pokemon.past_type.pokemon_type;
    }

    return pokemon.pokemon_type;
}
