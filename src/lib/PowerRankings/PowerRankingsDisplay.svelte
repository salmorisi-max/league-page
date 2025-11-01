<script>
  import BarChart from '$lib/BarChart.svelte';
  import { generateGraph, getTeamFromTeamManagers, round, predictScores, loadPlayers } from '$lib/utils/helper';

  export let nflState;
  export let rostersData;
  export let leagueTeamManagers;
  export let playersInfo;
  export let leagueData;

  const rosters = rostersData?.rosters ?? {};

  let validGraph = false;
  let graphs = [];
  let seasonOver = false;
  let curGraph = 0;

  // players map from Sleeper
  let players = playersInfo?.players ?? {};

  // ---- Custom power formula knobs ----
  // Position weights: tweak to taste
  const POS_W = {
    QB: 1.00,
    RB: 1.15,
    WR: 1.10,
    TE: 0.95,
    FLEX: 1.00,
    DEF: 0.90,
    K: 0.90
  };

  // Injury multipliers by status flag (best-effort; Sleeper flags vary by data source)
  // Q = Questionable, D = Doubtful, O = Out, IR/PUP = season impact
  const INJ_W = {
    Q: 0.90,
    D: 0.75,
    O: 0.60,
    IR: 0.55,
    PUP: 0.55
  };

  // Near-term weeks matter a bit more (decay for later weeks)
  // Example: next week weight ~1.00, later weeks gently decay toward ~0.85
  const recencyWeight = (offset) => {
    const w = 1.00 - 0.02 * offset; // 0,1,2,… offsets from current week
    return Math.max(0.85, w);
  };

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n ?? lo));

  const buildRankings = () => {
    const rosterPowers = [];

    const seasonEnd = 18;
    let week = clamp(nflState?.week, 1, seasonEnd);

    if (week >= seasonEnd) {
      seasonOver = true;
      validGraph = false;
      graphs = [];
      return;
    }

    let max = 0;

    for (const rosterID in rosters) {
      const roster = rosters[rosterID];
      const rosterPlayersRaw = roster?.players;
      if (!Array.isArray(rosterPlayersRaw) || rosterPlayersRaw.length === 0) continue;

      validGraph = true;

      // Build player list with best-effort position + injury tags
      const rosterPlayers = [];
      for (const pid of rosterPlayersRaw) {
        const p = players?.[pid];
        if (!p) continue;
        rosterPlayers.push({
          name: p.ln ?? p.fn ?? 'Player',
          pos: p.pos ?? 'FLEX',
          wi: p.wi ?? null           // injury flag if present
        });
      }
      if (rosterPlayers.length === 0) continue;

      // ---- Compute a per-team multiplier based on roster composition & injuries ----
      const multipliers = rosterPlayers.map((pl) => {
        const posW = POS_W[pl.pos] ?? POS_W.FLEX;
        const injW = pl.wi && INJ_W[pl.wi] ? INJ_W[pl.wi] : 1.0;
        return posW * injW;
      });
      const teamMult =
        multipliers.length ? multipliers.reduce((a, b) => a + b, 0) / multipliers.length : 1.0;

      // Team label: use TEAM NAME instead of manager handle
      const teamMeta = getTeamFromTeamManagers(leagueTeamManagers, rosterID) || {};
      const teamLabel =
        teamMeta.team_name || teamMeta.teamName || teamMeta.name || `Team ${rosterID}`;

      const rp = {
        rosterID,
        // label used for x-axis
        team: teamLabel,
        powerScore: 0
      };

      // Sum predicted scores for remaining weeks with multiplier + recency weighting
      // offset = 0 for current week, 1 for next, etc.
      let offset = 0;
      for (let wk = week; wk < seasonEnd; wk++, offset++) {
        const base = Number(predictScores(rosterPlayers, wk, leagueData)) || 0;
        const w = recencyWeight(offset);
        rp.powerScore += base * teamMult * w;
      }

      if (rp.powerScore > max) max = rp.powerScore;
      rosterPowers.push(rp);
    }

    if (rosterPowers.length === 0) {
      validGraph = false;
      graphs = [];
      return;
    }

    // Normalize 0–100 safely
    const denom = max === 0 ? 1 : max;
    for (const rp of rosterPowers) {
      rp.powerScore = round((rp.powerScore / denom) * 100);
    }

    // Build graph config with TEAM names on x-axis
    const powerGraph = {
      stats: rosterPowers.map(rp => ({
        ...rp,
        // BarChart/generateGraph typically reads this as the x label; if your helper uses a specific key, keep both.
        Manager: rp.team, // backward compat if your chart expects "Manager"
        Team: rp.team
      })),
      x: 'Team',                   // <-- label on axis
      y: 'Power Ranking',
      stat: '',
      header: 'Rest of Season Power Rankings',
      field: 'powerScore',
      short: 'ROS Power Ranking'
    };

    graphs = [generateGraph(powerGraph, leagueData?.season)];
  };

  buildRankings();

  const refreshPlayers = async () => {
    try {
      const newPlayersInfo = await loadPlayers(null, true);
      players = newPlayersInfo?.players ?? {};
      buildRankings();
    } catch {
      // ignore; keep last good graph
    }
  };

  if (playersInfo?.stale) {
    refreshPlayers();
  }
</script>

<style>
  .enclosure {
    display: block;
    position: relative;
    width: 100%;
  }
</style>

{#if validGraph && !seasonOver}
  <div class="enclosure">
    <BarChart {graphs} bind:curGraph={curGraph} {leagueTeamManagers} />
  </div>
{/if}