const axios = require('axios');
const fs = require('fs');
const log = require("../../util/structs/log.js")
const path = require('path');
const { AthenaLoadingScreen } = require('../types/prices.js');
const { TypedItems, CosmeticItems, Apart } = require("../utils/TypedItems.js");


function Vintro(intro) {
    if (!intro) {
        return false;
    }
    if (intro.chapter && intro.season) {
        if ((intro.chapter === '1' && parseInt(intro.season) >= 1 && parseInt(intro.season) <= 9) ||
            (intro.chapter === '1' && intro.season === '9')) {
            return true;
        }
    }
    return false;
}

const CosmeticTypes = {
    AthenaCharacter: "AthenaCharacter",
    AthenaBackpack: "AthenaBackpack",
    AthenaGlider: "AthenaGlider",
    AthenaPickaxe: "AthenaPickaxe",
    AthenaLoadingScreen: "AthenaLoaadingScreen",
    AthenaDance: "AthenaDance"
}

const url = "https://fortnite-api.com/v2/cosmetics/br";

function getRandomSet(item) {
    const sets = [];

    const randomSet = [];

    // console.log(item)

    if (!randomSet[item.backendValue]) {
        randomSet[item.backendValue] = {
            backendName: item.value,
            displayName: item.text,
            items: []
        }
    }

    randomSet[item.backendValue].items.push(item);


    for (const key in randomSet) {
        const set = randomSet[key];

        if (set.backendName === "") continue;

        sets.push(set);
    }

    sets.sort((a, b) => {
        return a.backendName.localeCompare(b.backendName);
    })


    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;


    return sets[randomInt(0, sets.length)];
}

axios.get(url)
    .then(response => {
        const data = response.data;

        const Vitems = [];

        data.data.forEach(item => {
            const intro = item.introduction || null;
            if (Vintro(intro)) {
                const displayAssetPath = item.displayAssetPath ? item.displayAssetPath.replace("FortniteGame/Content", "/Game") : null;
                const lastPath = displayAssetPath ? displayAssetPath.split("/").pop() : null;
                const fullDisplayAssetPath = displayAssetPath ? `${displayAssetPath}.${lastPath}` : null;


                const set = getRandomSet(item);

                const itemType = item.type && typeof item.type === "object" ? item.type.backendValue : null;

                if (itemType && CosmeticTypes[itemType] !== undefined) {
                    item.type.backendValue = CosmeticTypes[itemType];
                }

                if (!itemType) return;

                if (!TypedItems[itemType]) {
                    TypedItems[itemType] = []
                }

                TypedItems[itemType].push(item);
                CosmeticItems[item.id] = item;


                for (const fortniteBackbling of TypedItems.AthenaBackpack) {
                    if (!fortniteBackbling.itemPreviewHeroPath) continue;

                    const parts = fortniteBackbling.itemPreviewHeroPath.split("/");

                    const cosmetic = CosmeticItems[parts[parts.length - 1]];

                    if (!cosmetic) continue;

                    cosmetic.backpack = fortniteBackbling;

                    // if (Apart[item.id].backpack === undefined) Apart[item.id].backpack = {};

                    Apart[item.id] = fortniteBackbling;
                }

                const validItem = {
                    id: item.id,
                    type: item.type?.backendValue,
                    rarity: item.rarity?.value,
                    introduction: {
                        chapter: intro.chapter,
                        season: intro.season
                    },
                    added: item.added,
                    displayAssetPath: fullDisplayAssetPath,
                    backpack: CosmeticItems[item.id].backpack, 
                    shopHistory: item.shopHistory,
                    set,
                };
                Vitems.push(validItem);
            }
        });


        const output = path.join(__dirname, '..', '..', 'resources', 'storefrontitems.json');
        fs.writeFileSync(output, JSON.stringify(Vitems, null, 4));
    })
    .catch(error => {
        console.error("Error fetching data:", error);
    });
