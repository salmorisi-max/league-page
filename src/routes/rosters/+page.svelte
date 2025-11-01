<script>
  import LinearProgress from '@smui/linear-progress';
  import { Rosters } from '$lib/components';

  export let data;

  // Promise: unchanged from your version
  const rostersInfo = data.rostersInfo;

  // Optional: if you expose a refresher, we'll call it
  const refreshRosters = typeof data?.refreshRosters === 'function' ? data.refreshRosters : null;

  // re-run await block on demand
  let reloadKey = 0;
  async function retry() {
    try {
      if (refreshRosters) await refreshRosters();
    } finally {
      reloadKey += 1;
    }
  }

  // UI controls
  let q = '';
  let pos = 'ALL'; // ALL, QB, RB, WR, TE, K, DEF

  // helpers
  const norm = (s) => (s || '').toString().toLowerCase();
  const POS_OPTIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

  function rosterMatches({ team, manager, players }, playersInfo) {
    if (!q && (pos === 'ALL')) return true;
    const query = norm(q);

    // team / manager text
    const hayTeam = [team?.teamName, team?.username, team?.name].filter(Boolean).map(norm).join(' ');
    const hayMgr  = [manager?.teamName, manager?.username, manager?.name].filter(Boolean).map(norm).join(' ');
    let textHit = !q || hayTeam.includes(query) || hayMgr.includes(query);

    // players text + position filter
    let posHit = (pos === 'ALL');
    let nameHit = !q;
    const mp = playersInfo?.players || {};

    for (const pid of (players || [])) {
      const p = mp[pid];
      if (!p) continue;
      const pName = [p.fn, p.ln, p.full_name, p.first_name, p.last_name].filter(Boolean).join(' ');
      const pPos  = (p.pos || p.position || '').toUpperCase();

      if (pos !== 'ALL' && !posHit) {
        // Sleeper uses D/ST as "DEF" or "D/ST" in some libs—normalize a bit
        const canon = pPos === 'DST' ? 'DEF' : pPos;
        if (canon === pos) posHit = true;
      }
      if (q && !nameHit) {
        nameHit = norm(pName).includes(query);
      }
      if (textHit && nameHit && (posHit || pos === 'ALL')) break;
    }

    return textHit && nameHit && (posHit || pos === 'ALL');
  }

  // try to attach team/meta to a roster row for client filtering
  function enrichRosters(rosterData, leagueTeamManagers) {
    if (!Array.isArray(rosterData)) return [];
    return rosterData.map((r) => {
      const rid = String(r?.roster_id ?? r?.rosterID ?? r?.id ?? '');
      const tm = (leagueTeamManagers || []).find(t => String(t?.rosterID) === rid) || {};
      const manager = tm; // in many builds team & manager info live together
      return {
        ...r,
        _rid: rid,
        _team: { teamName: tm.teamName, username: tm.username, name: tm.name },
        _manager: manager,
      };
    });
  }
</script>

<svelte:head>
  <title>Rosters — The League</title>
</svelte:head>

<style>
  .holder { position: relative; z-index: 1; }
  .loading, .error, .empty {
    display: block;
    width: 85%;
    max-width: 800px;
    margin: 80px auto;
    text-align: center;
  }

  .controls {
    position: sticky;
    top: 64px;
    z-index: 2;
    margin: 0 auto 16px;
    padding: 10px 12px;
    max-width: 800px;
    width: 85%;
    background: #0e0f11;
    border: 1px solid var(--borderOverride);
    border-radius: 10px;
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .search {
    flex: 1;
    min-width: 180px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #0c0c0c;
    border: 1px solid var(--borderOverride);
    color: var(--g000);
  }
  .select {
    min-width: 140px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #0c0c0c;
    border: 1px solid var(--borderOverride);
    color: var(--g000);
  }
  .btn {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--borderOverride);
    background: #0f1216;
    color: var(--g000);
    cursor: pointer;
  }
  .btn:hover { box-shadow: 0 6px 20px rgba(0,0,0,.35); }

  .meta {
    color: var(--g555);
    font-size: 0.9rem;
    white-space: nowrap;
  }
</style>

<div class="holder">
  {#key reloadKey}
    {#await rostersInfo}
      <div class="loading" role="status" aria-live="polite">
        <p>Retrieving roster data…</p>
        <br />
        <LinearProgress indeterminate aria-label="Loading rosters" />
      </div>

    {:then [leagueData, rosterData, leagueTeamManagers, playersInfo]}
      {#if !Array.isArray(rosterData) || rosterData.length === 0}
        <div class="empty">
          <p>No rosters found.</p>
          <button class="btn" on:click={retry}>Retry</button>
        </div>
      {:else}
        <!-- Controls -->
        <div class="controls">
          <input
            class="search"
            type="search"
            placeholder="Search team, manager, or player…"
            bind:value={q}
            aria-label="Search rosters"
          />
          <select class="select" bind:value={pos} aria-label="Filter by position">
            {#each POS_OPTIONS as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
          <div class="meta">
            {
              enrichRosters(rosterData, leagueTeamManagers)
                .filter(r => rosterMatches(
                  { team: r._team, manager: r._manager, players: r.players },
                  playersInfo
                )).length
            }
            /
            {rosterData.length}
          </div>
          <button class="btn" on:click={() => (q = '', pos = 'ALL')} aria-label="Clear filters">Clear</button>
          <button class="btn" on:click={retry} aria-label="Refresh rosters">Refresh</button>
        </div>

        <!-- Filtered pass-through to your component -->
        {#let filtered =
          enrichRosters(rosterData, leagueTeamManagers).filter(r =>
            rosterMatches(
              { team: r._team, manager: r._manager, players: r.players },
              playersInfo
            )
          )
        }
          <Rosters
            {leagueData}
            rosterData={filtered}
            {leagueTeamManagers}
            {playersInfo}
          />
        {/let}
      {/if}

    {:catch error}
      <div class="error">
        <p>Something went wrong: {error?.message || 'Unknown error'}</p>
        <button class="btn" on:click={retry}>Retry</button>
      </div>
    {/await}
  {/key}
</div>