// src/lib/utils/helperFunctions/legacyHistory.js
export async function getLegacyHistory() {
  const seasons = [
    { year: 2019, champion: 'Emad' },
    { year: 2020, champion: 'Zak' },
    { year: 2021, champion: null, note: 'League implosion and ended' },
    { year: 2022, champion: 'Abe H' },
    { year: 2023, champion: 'Amir' },
    { year: 2024, champion: 'Moe G' },
  ];

  const allTimeChampionships = {};
  for (const s of seasons) {
    if (s.champion) {
      allTimeChampionships[s.champion] = (allTimeChampionships[s.champion] || 0) + 1;
    }
  }

  return {
    source: 'Legacy (manual)',
    seasons,
    summary: {
      totalSeasons: seasons.length,
      allTimeChampionships,
    },
  };
}