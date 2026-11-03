
import {
    getAvailableGames,
    getGamePokemon,
    getTypeChartForGeneration,
    getPokemonTypes
} from "./data-loader.js";

import {
    calculateCoverage,
    COVERAGE_CATEGORIES
} from "./coverage.js";

const gameSelect = document.getElementById("game-select");
const typeSelector = document.getElementById("type-selector");
const typeCount = document.getElementById("type-count");
const megaToggle = document.getElementById("mega-toggle");
const resultsContainer = document.getElementById("results-container");
const resultsSummary = document.getElementById("results-summary");
const coverageSummary = document.getElementById("coverage-summary");
const summaryTotal = document.getElementById("summary-total");


const TYPE_IMAGE_PATH = "./richi3f/static/img/type/";
const POKEMON_IMAGE_PATH = "./richi3f/static/img/pokemon/";
const UNKNOWN_IMAGE = `${POKEMON_IMAGE_PATH}0000_000_uk_n.png`;

const CATEGORY_LABELS = {
    4: "4× effectiveness",
    2: "2× effectiveness",
    1: "1× effectiveness",
    0.5: "½× effectiveness",
    0.25: "¼× effectiveness",
    0: "No effect"
};

const CATEGORY_ORDER = [0, 0.25, 0.5, 1, 2, 4];

let availableGames = [];
let selectedTypes = [];
let currentPokemon = [];
let currentTypeChart = null;
let currentGeneration = null;

function getCurrentGame() {
    return availableGames.find(game => game.slug === gameSelect.value);
}

function populateGames() {
    availableGames = getAvailableGames();

    gameSelect.replaceChildren();

    for (const game of availableGames) {
        const option = document.createElement("option");
        option.value = game.slug;
        option.textContent = game.name;
        gameSelect.appendChild(option);
    }

    if (availableGames.length > 0) {
        gameSelect.value = availableGames[0].slug;
        loadGame();
    }
}


function populateTypes() {
    typeSelector.replaceChildren();

    if (!currentTypeChart) {
        return;
    }

    const types = Object.keys(currentTypeChart);

    for (const type of types) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "type-button";
        button.dataset.type = type;
        button.title = type.charAt(0).toUpperCase() + type.slice(1);
        button.setAttribute("aria-label", button.title);

        const image = document.createElement("img");
        image.src = `${TYPE_IMAGE_PATH}${type}.png`;
        image.alt = "";
        image.onerror = () => {
            image.remove();
        };

        button.appendChild(image);

        button.addEventListener("click", () => {
            toggleType(type);
        });

        typeSelector.appendChild(button);
    }

    updateTypeButtons();
}

function toggleType(type) {
    if (selectedTypes.includes(type)) {
        selectedTypes = selectedTypes.filter(selected => selected !== type);
    } else {
        if (selectedTypes.length >= 4) {
            return;
        }

        selectedTypes.push(type);
    }

    updateTypeButtons();
    renderResults();
}

function updateTypeButtons() {
    const buttons = typeSelector.querySelectorAll(".type-button");

    for (const button of buttons) {
        const selected = selectedTypes.includes(button.dataset.type);

        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
        button.disabled = !selected && selectedTypes.length >= 4;
    }

    typeCount.textContent = `${selectedTypes.length} / 4 selected`;
}

function loadGame() {
    const game = getCurrentGame();

    if (!game) {
        return;
    }

    currentGeneration = game.generation;
    currentTypeChart = getTypeChartForGeneration(currentGeneration);
    currentPokemon = getGamePokemon(game.slug);

    selectedTypes = [];

    megaToggle.checked = false;
    megaToggle.disabled = !game.hasMegaEvolutions;
    megaToggle.parentElement.style.opacity =
        game.hasMegaEvolutions ? "1" : "0.5";

    populateTypes();
    renderResults();
}


function getPokemonSpriteUrls(pokemon) {
    const base = [
        String(pokemon.base_id).padStart(4, "0"),
        String(pokemon.form_id).padStart(3, "0")
    ].join("_");

    return ["mf", "md", "fd", "mo", "fo", "uk"].map(gender =>
        `${POKEMON_IMAGE_PATH}${base}_${gender}_n.png`
    );
}



function getPokemonDisplayName(pokemon) {
    if (pokemon.is_mega && pokemon.form_name) {
        return pokemon.form_name;
    }

    if (pokemon.form_name) {
        return `${pokemon.name} (${pokemon.form_name})`;
    }

    return pokemon.name;
}


function createPokemonCard(pokemon) {
    const card = document.createElement("div");
    card.className = "pokemon-card";

    const image = document.createElement("img");
    const spriteUrls = getPokemonSpriteUrls(pokemon);
    let spriteIndex = 0;

    image.src = spriteUrls[spriteIndex];
    image.alt = pokemon.name;
    image.loading = "lazy";

    image.onerror = () => {
        spriteIndex++;

        if (spriteIndex < spriteUrls.length) {
            image.src = spriteUrls[spriteIndex];
        } else {
            image.onerror = null;
            image.src = UNKNOWN_IMAGE;
        }
    };

    const name = document.createElement("span");
    name.className = "pokemon-name";
    name.textContent = getPokemonDisplayName(pokemon);

    const types = document.createElement("div");
    types.className = "pokemon-types";

    const pokemonTypes = getPokemonTypes(pokemon, currentGeneration);

    for (const type of pokemonTypes) {
        const typeImage = document.createElement("img");
        typeImage.src = `${TYPE_IMAGE_PATH}${type}.png`;
        typeImage.alt = type;
        typeImage.title = type;
        typeImage.onerror = () => {
            typeImage.remove();
        };

        types.appendChild(typeImage);
    }

    card.append(image, name, types);

    return card;
}



function renderCategory(multiplier, pokemonList) {
    const category = document.createElement("section");
    category.className = "coverage-category";

    const header = document.createElement("div");
    header.className = "category-header";

    const heading = document.createElement("h3");
    heading.textContent = CATEGORY_LABELS[multiplier];

    const count = document.createElement("span");
    count.className = "category-count";
    count.textContent = `${pokemonList.length} Pokémon`;

    header.append(heading, count);
    category.appendChild(header);

    if (pokemonList.length > 0) {
        const grid = document.createElement("div");
        grid.className = "pokemon-grid";

        for (const pokemon of pokemonList) {
            grid.appendChild(createPokemonCard(pokemon));
        }

        category.appendChild(grid);
    }

    return category;
}


function renderResults() {
    resultsContainer.replaceChildren();

    if (selectedTypes.length === 0) {
        coverageSummary.replaceChildren();
        summaryTotal.textContent = "";
        resultsSummary.textContent =
            "Select at least one attacking type to see coverage.";
        resultsContainer.innerHTML =
            '<p class="empty-state">Your results will appear here.</p>';
        return;
    }

    const game = getCurrentGame();

    if (!game) {
        return;
    }

    const pokemonList = currentPokemon.filter(pokemon => {
        return megaToggle.checked
            ? true
            : !pokemon.is_mega;
    });

    const coverage = calculateCoverage(
        pokemonList,
        selectedTypes,
        currentTypeChart,
        currentGeneration
    );


    const total = pokemonList.length;

    resultsSummary.textContent =
        `${total} Pokémon evaluated using ${selectedTypes.length} attacking type${selectedTypes.length === 1 ? "" : "s"}.`;

    summaryTotal.textContent = `${total} Pokémon`;

    coverageSummary.replaceChildren();

    for (const multiplier of CATEGORY_ORDER) {
        const item = document.createElement("div");
        item.className = "summary-item";

        const value = document.createElement("span");
        value.className = "summary-value";
        value.textContent = `${multiplier}×`;

        const label = document.createElement("span");
        label.className = "summary-label";
        label.textContent = CATEGORY_LABELS[multiplier];

        const count = document.createElement("span");
        count.className = "summary-count";
        count.textContent = coverage[multiplier].length;

        item.append(value, label, count);
        coverageSummary.appendChild(item);
    }

    for (const multiplier of CATEGORY_ORDER) {
        resultsContainer.appendChild(
            renderCategory(multiplier, coverage[multiplier])
        );
    }

}

gameSelect.addEventListener("change", loadGame);
megaToggle.addEventListener("change", renderResults);

populateGames();
