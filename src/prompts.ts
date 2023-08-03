import inquirer from "inquirer";
import Jsoning from "jsoning";
import { Mods } from "./types";

async function getMinPP() {
  const minimumPP = await inquirer.prompt([
    {
      name: "Options",
      type: "number",
      message: "Minimum PP (leave empty for no minimum):",
    },
  ]);

  if (minimumPP.Options < 0) {
    console.log("\n❌ Minimum PP cannot be negative\n");
    return getMinPP();
  } else {
    return minimumPP;
  }
}

async function getMaxPP(minimumPP: any) {
  const maximumPP = await inquirer.prompt([
    {
      name: "Options",
      type: "number",
      message: "Maximum PP (leave empty for no maximum):",
    },
  ]);

  if (maximumPP.Options < 0) {
    console.log("\n❌ Maximum PP cannot be negative\n");
    getMaxPP(minimumPP);
  } else if (minimumPP.Options && minimumPP.Options >= maximumPP.Options) {
    console.log("\n❌ Minimum PP cannot be greater than Maximum PP\n");
    getMaxPP(minimumPP);
  } else {
    return maximumPP;
  }
}

async function getMinLength() {
  const minimumLength = await inquirer.prompt([
    {
      name: "Options",
      type: "number",
      message: "Minimum Map Length in seconds (leave empty for no minimum):",
    },
  ]);

  if (minimumLength.Options < 0) {
    console.log("\n❌ Minimum Length cannot be negative\n");
    getMinLength();
  } else {
    return minimumLength;
  }
}

async function getMaxLength(minimumLength: any) {
  const maximumLength = await inquirer.prompt([
    {
      name: "Options",
      type: "number",
      message: "Maximum Map Length in seconds (leave empty for no maximum):",
    },
  ]);

  if (maximumLength.Options < 0) {
    console.log("\n❌ Maximum Length cannot be negative\n");
    getMaxLength(minimumLength);
  } else if (
    minimumLength.Options &&
    minimumLength.Options >= maximumLength.Options
  ) {
    console.log("\n❌ Minimum Length cannot be greater than Maximum Length\n");
    getMaxLength(minimumLength);
  } else {
    return maximumLength;
  }
}

async function getMinStarRate() {
  const minimumStarRate = await inquirer.prompt([
    {
      name: "Options",
      type: "number",
      message: "Minimum Star Rate (leave empty for no minimum):",
    },
  ]);

  if (minimumStarRate.Options < 0) {
    console.log("\n❌ Minimum Star Rate cannot be negative\n");
    getMinStarRate();
  } else {
    return minimumStarRate;
  }
}

async function getMaxStarRate(minimumStarRate: any) {
  const maximumStarRate = await inquirer.prompt([
    {
      name: "Options",
      type: "number",
      message: "Maximum Star Rate (leave empty for no maximum):",
    },
  ]);

  if (maximumStarRate.Options < 0) {
    console.log("\n❌ Maximum Star Rate cannot be negative\n");
    getMaxStarRate(minimumStarRate);
  } else if (
    minimumStarRate.Options &&
    minimumStarRate.Options >= maximumStarRate.Options
  ) {
    console.log(
      "\n❌ Minimum Star Rate cannot be greater than Maximum Star Rate\n"
    );
    getMaxStarRate(minimumStarRate);
  } else {
    return maximumStarRate;
  }
}

async function getMods() {
  const mods = await inquirer.prompt([
    {
      name: "Options",
      type: "list",
      message: "Choose a mod:",
      choices: ["NM", "DT", "HD", "HR", "HDDT", "HDHR", "HDHRDT", "None"],
    },
  ]);

  return mods;
}

async function showFilter() {
  const settings = new Jsoning("settings.json");

  const filterData = await settings.get("filter");
  console.log("\n📃 Current filter:");
  console.log(`Minimum PP: ${filterData.minPP ? filterData.minPP : "None"}`);
  console.log(`Maximum PP: ${filterData.maxPP ? filterData.maxPP : "None"}`);
  console.log(
    `Minimum Length: ${filterData.minLength ? filterData.minLength : "None"}`
  );
  console.log(
    `Maximum Length: ${filterData.maxLength ? filterData.maxLength : "None"}`
  );
  console.log(
    `Minimum Star Rate: ${
      filterData.minStarRate ? filterData.minStarRate : "None"
    }`
  );
  console.log(
    `Maximum Star Rate: ${
      filterData.maxStarRate ? filterData.maxStarRate : "None"
    }`
  );
  console.log(`Mods: ${getEnumByValue(Mods, filterData.mods)}\n`);

  await inquirer.prompt([
    {
      name: "Options",
      type: "list",
      message: "Return to options?",
      choices: ["Yes"],
    },
  ]);
}

function getEnumByValue(enumObject: any, value: string): string | undefined {
  return Object.keys(enumObject).find((key) => enumObject[key] === value);
}

export {
  getMinPP,
  getMaxPP,
  getMinLength,
  getMaxLength,
  getMods,
  showFilter,
  getMinStarRate,
  getMaxStarRate,
};
