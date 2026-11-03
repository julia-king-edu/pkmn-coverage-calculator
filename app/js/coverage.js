
const COVERAGE_CATEGORIES = [0, 0.25, 0.5, 1, 2, 4];

function getTypeEffectiveness(attackingType, defendingTypes, typeChart) {
    return defendingTypes.reduce((multiplier, defendingType) => {
        const defenseData = typeChart[defendingType];

        if (!defenseData) {
            return multiplier;
        }

        if (defenseData.immune2.includes(attackingType)) {
            return multiplier * 0;
        }

        if (defenseData.resists.includes(attackingType)) {
            return multiplier * 0.5;
        }

        if (defenseData.weak2.includes(attackingType)) {
            return multiplier * 2;
        }

        return multiplier;
    }, 1);
}

export function calculateCoverage(
    pokemonList,
    selectedTypes,
    typeChart,
    generation
) {
    const results = Object.fromEntries(
        COVERAGE_CATEGORIES.map(multiplier => [multiplier, []])
    );

    if (!selectedTypes.length) {
        return results;
    }

    for (const pokemon of pokemonList) {
        const defendingTypes =
            pokemon.past_type && generation < pokemon.past_type.generation
                ? pokemon.past_type.pokemon_type
                : pokemon.pokemon_type;

        const bestMultiplier = Math.max(
            ...selectedTypes.map(attackingType =>
                getTypeEffectiveness(
                    attackingType,
                    defendingTypes,
                    typeChart
                )
            )
        );

        results[bestMultiplier].push({
            ...pokemon,
            coverageMultiplier: bestMultiplier
        });
    }

    return results;
}

export { COVERAGE_CATEGORIES };
