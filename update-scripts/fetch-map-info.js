'use strict';

const axios = require('./axios');
const oneLineLog = require('single-line-log').stdout;
const fs = require('fs');
const { truncateFloat, delay, getDiffHours, files, writeJson, readJson } = require('./utils');
const { modes } = require('./constants');

const apikey = JSON.parse(fs.readFileSync('./config.json')).apikey;

// a=1 - add converts to response
const urlBeatmapInfo = (diffId, modeId) =>
  `https://osu.ppy.sh/api/get_beatmaps?k=${apikey}&b=${diffId}&limit=1&m=${modeId}` +
  (modeId > 0 ? '&a=1' : '');
const getUniqueMapId = (map) => `${map.b}_${map.m}`;

let maps = {};
let mapsCache = {};

const shouldUpdateCached = (cached) => {
  const hasMapUpdatedAfterCached =
    new Date(cached.last_update) > new Date(cached.cache_date) ||
    new Date(cached.approved_date) > new Date(cached.cache_date) ||
    new Date(cached.submit_date) > new Date(cached.cache_date);
  return !cached.cache_date || hasMapUpdatedAfterCached || cached.passcount < 1000;
};

const addBeatmapInfo = (map, mode) => {
  const shouldFetchMapInfo = !mapsCache[map.b] || shouldUpdateCached(mapsCache[map.b]);

  const getPromise = !shouldFetchMapInfo
    ? Promise.resolve(mapsCache[map.b])
    : axios.get(urlBeatmapInfo(map.b, mode.id)).then(({ data }) => {
        if (data.length > 0) {
          const diff = data[0];
          Object.keys(diff).forEach((key) => {
            const parsed = Number(diff[key]);
            diff[key] = isNaN(parsed) ? diff[key] : truncateFloat(parsed);
          });
          mapsCache[map.b] = {
            ...diff,
            cache_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
          };
          return diff;
        } else {
          console.log('No maps found :(');
        }
      });

  return getPromise
    .then((diff) => {
      if (diff) {
        map.art = diff.artist;
        map.t = diff.title;
        map.v = diff.version;
        map.s = diff.beatmapset_id;
        map.l = diff.hit_length;
        map.bpm = diff.bpm;
        map.d = diff.difficultyrating;
        map.p = diff.passcount;
        map.h = getDiffHours(diff); // Hours since it was ranked
        map.appr_h = Math.floor(new Date(diff.approved_date).getTime() / 1000 / 60 / 60); // Hours since 1970
        map.g = diff.genre_id;
        map.ln = diff.language_id;
        if (mode === modes.mania && diff.mode === modes.mania.id) {
          // Key count for mania
          map.k = diff.diff_size;
        }

        const mapId = getUniqueMapId(map);
        maps[mapId] = map;
      } else {
        console.log('No maps found :(');
      }
    })
    .catch((err) => {
      console.log('Error for /b/', map.b, err.message);
      return delay(1000).then(() => addBeatmapInfo(map, mode));
    });
};

module.exports = async (mode) => {
  console.log(`2. FETCHING MAP INFO - ${mode.text}`);
  maps = {};
  mapsCache = {};
  let mapsArray = [];
  if (fs.existsSync(files.mapInfoCache(mode))) {
    try {
      mapsCache = await readJson(files.mapInfoCache(mode));
      console.log('Loaded maps cache');
    } catch (e) {
      console.log('Error parsing ' + files.mapInfoCache(mode));
    }
  }
  try {
    mapsArray = await readJson(files.mapsList(mode));
    console.log('Loaded maps list');
  } catch (e) {
    console.log('Error parsing ' + files.mapsList(mode));
  }
  let lastSaveAt = null;

  for (let index = 0; index < mapsArray.length; index++) {
    const map = mapsArray[index];
    oneLineLog(
      `Loading map #${index + 1}/${mapsArray.length} (${mode.text})${
        lastSaveAt ? ' last saved at: ' + lastSaveAt : ''
      }`
    );

    await addBeatmapInfo(map, mode);

    if ((index + 1) % 5000 === 0) {
      const arrayMaps = Object.keys(maps)
        .map((mapId) => maps[mapId])
        .sort((a, b) => b.x - a.x);
      lastSaveAt = index + 1;
      await writeJson(files.mapsDetailedList(mode), arrayMaps);
      await writeJson(files.mapInfoCache(mode), mapsCache);
    }
  }

  console.log();
  const arrayMaps = Object.keys(maps)
    .map((mapId) => maps[mapId])
    .sort((a, b) => b.x - a.x);
  await writeJson(files.mapsDetailedList(mode), arrayMaps);
  await writeJson(files.mapInfoCache(mode), mapsCache);
  console.log(`${arrayMaps.length} maps saved. Done fetching detailed map info! (${mode.text})`);
};
