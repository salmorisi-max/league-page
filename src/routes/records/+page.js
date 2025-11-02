import {
  getLeagueRecords,
  getLeagueTeamManagers,
  getLeagueTransactions,
  waitForAll,
  getLegacyHistory
} from '$lib/utils/helper';

export async function load() {
  const [records, transactions, managers, legacy] = await waitForAll(
    getLeagueRecords(false),
    getLeagueTransactions(false),
    getLeagueTeamManagers(),
    getLegacyHistory()
  );

  // merge legacy champions/history into the records object
  const leagueData = { ...records, legacy };

  // keep the tuple shape your +page.svelte expects
  return {
    recordsInfo: [leagueData, transactions, managers]
  };
}