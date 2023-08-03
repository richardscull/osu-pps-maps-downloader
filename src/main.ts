import Papa from "papaparse";
import fs from "fs";
import inquirer from "inquirer";
import Jsoning from "jsoning";
import { BeatmapDiff, BeatmapDiffLegacy, Mods } from "./types";
import * as prompts from "./prompts";
import { normalizeBeatmap } from "./normalize";
import Axios from "axios";

const main = async () => {
  console.log("🌿 Welcome to osu-pps-maps-downloader! \n");

  if (!fs.existsSync("settings.json")) {
    console.log("⚠️ Settings file not found, creating one...\n");
    const settings = new Jsoning("settings.json");

    await changePath(false);
    await changeFilter();
  } else {
    await showOptions();
  }
};

main();

async function changePath(returnToOptions?: boolean) {
  const settings = new Jsoning("settings.json");

  const path = await inquirer.prompt([
    {
      name: "Path",
      type: "input",
      message:
        "Set your osu! path. Example: C:\\Users\\User\\AppData\\Local\\osu!\\Songs\\",
    },
  ]);

  if (!fs.existsSync(path.Path)) {
    console.log("\n❌ Invalid path\n");
    await changePath(returnToOptions);
  }

  await settings.set("path", path.Path);
  console.log("\n✅ Path changed successfully\n");

  if (returnToOptions) await showOptions();
}

async function changeFilter() {
  const minimumPP = await prompts.getMinPP();
  const maximumPP = await prompts.getMaxPP(minimumPP);
  const minimumLength = await prompts.getMinLength();
  const maximumLength = await prompts.getMaxLength(minimumLength);
  const minimumStarRate = await prompts.getMinStarRate();
  const maximumStarRate = await prompts.getMaxStarRate(minimumStarRate);
  const mods = await prompts.getMods();

  const settings = new Jsoning("settings.json");
  await settings.set("filter", {
    minPP: minimumPP.Options,
    maxPP: maximumPP.Options,
    minLength: minimumLength.Options,
    maxLength: maximumLength.Options,
    minStarRate: minimumStarRate.Options,
    maxStarRate: maximumStarRate.Options,
    mods: Mods[mods.Options as keyof typeof Mods],
  });

  console.log("\n✅ Filter changed successfully\n");
  await showOptions();
}

async function showOptions() {
  const options = await inquirer.prompt([
    {
      name: "Options",
      type: "list",
      message: "Choose an option",
      choices: [
        "🔍 Find and download maps",
        "Current filter",
        "Change filter",
        "Change osu!Songs path",
        "🚪 Exit",
      ],
    },
  ]);

  switch (options.Options) {
    case "🔍 Find and download maps":
      await getFiltredDiffs();
    case "Current filter":
      await prompts.showFilter();
      await showOptions();
    case "Change filter":
      await changeFilter();
    case "Change osu!Songs path":
      await changePath(true);
    case "🚪 Exit":
      console.log("Exiting...");
      process.exit(0);
  }
}

function getDiffs() {
  const diffs = fs.readFileSync("osu-pps/data/maps/osu/diffs.csv", "utf8");

  const diffsParsed = Papa.parse(diffs, {
    header: true,
  });

  return diffsParsed.data.map((diff) =>
    normalizeBeatmap(diff as BeatmapDiffLegacy)
  );
}

async function getFiltredDiffs() {
  const diffs = getDiffs();

  const settings = new Jsoning("settings.json");
  const filter = await settings.get("filter");

  const filtred = diffs.filter((diff) => {
    const beatmapPP = diff.pp ? diff.pp : 0;

    if (filter.minPP && filter.minPP < beatmapPP) return false;
    if (filter.maxPP && beatmapPP >= filter.maxPP) return false;
    if (filter.minLength && filter.minLength < diff.length) return false;
    if (filter.maxLength && diff.length >= filter.maxLength) return false;
    if (filter.minStarRate && filter.minStarRate < diff.difficulty)
      return false;
    if (filter.maxStarRate && diff.difficulty >= filter.maxStarRate)
      return false;
    if (filter.mods && filter.mods != diff.mods.toString()) return false;
    return true;
  });

  if (filtred.length == 0) {
    console.log("\n❌ No maps found\n");
    await showOptions();
  }

  console.log(`\n✅ ${filtred.length} diffs found!\n`);

  const options = await inquirer.prompt([
    {
      name: "Options",
      type: "list",
      message: "Choose an option",
      choices: ["⬇️ Download maps", "To menu"],
    },
  ]);

  switch (options.Options) {
    case "⬇️ Download maps":
      await downloadMaps(filtred);
    case "To menu":
      await showOptions();
  }
}

async function downloadMaps(diffs: BeatmapDiff[]) {
  console.log("\n⌛ Loading maps...\n");
  const getMapsetsIds = diffs
    .map((diff) => diff.mapsetId)
    .filter((value, index, array) => {
      return array.indexOf(value) === index;
    });

  const settings = new Jsoning("settings.json");
  const path = await settings.get("path");
  const options = await inquirer.prompt([
    {
      name: "Options",
      type: "number",
      message: "How many maps do you want to download? (0 for all)",
    },
  ]);

  let goodResponsesCount = 0;
  let mapsetsToDownload = 0;
  if (options.Options == 0 || options.Options > getMapsetsIds.length) {
    mapsetsToDownload = getMapsetsIds.length;
  } else if (options.Options <= 0) {
    mapsetsToDownload = 0;
  } else {
    mapsetsToDownload = options.Options;
  }

  console.log("\n");

  for (let i = 0; i < mapsetsToDownload; i++) {
    const url = `https://api.chimu.moe/v1/download/${getMapsetsIds[i]}`;

    console.log(`⌛ Downloading ${i + 1}/${mapsetsToDownload}\n`);

    try {
      const response = await Axios({
        method: "GET",
        url: url,
        responseType: "stream",
      });

      response.data.pipe(
        fs.createWriteStream(path + "\\" + getMapsetsIds[i] + ".osz")
      );

      await new Promise<void>((resolve, reject) => {
        response.data.on("end", () => {
          goodResponsesCount++;
          resolve();
        });

        response.data.on("error", () => {
          reject();
        });
      });
    } catch (error) {
      console.log(`❌ Error downloading ${i + 1}/${mapsetsToDownload}\n`);
    }
  }

  console.log(`\n✅ ${goodResponsesCount} maps downloaded\n`);

  await showOptions();
}
