<script>
  import LinearProgress from '@smui/linear-progress';
  import { Rivalry } from '$lib/components';
  import { waitForAll } from '$lib/utils/helper';
  import { onMount } from 'svelte';

  export let data;
  const {
    leagueTeamManagerData,
    playersData,
    transactionsData,
    recordsData,
    playerOne: propOne,
    playerTwo: propTwo,
  } = data;

  // allow URL params to override props (or fill them if missing)
  let playerOne = propOne ?? null;
  let playerTwo = propTwo ?? null;

  onMount(() => {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams;
      const one = q.get('one');
      const two = q.get('two');
      if (one) playerOne = one;
      if (two) playerTwo = two;
    } catch {}
  });

  // force re-run of the await block on retry
  let reloadKey = 0;
  const retry = () => { reloadKey += 1; };

  const id = (x) => (x == null ? null : String(x));

  function getDisplayName(leagueTeamManagers, maybeId) {
    if (!leagueTeamManagers || !maybeId) return null;
    const key = String(maybeId);
    let found = leagueTeamManagers.find(t => String(t?.rosterID) === key);
    if (found?.teamName) return found.teamName;
    found = leagueTeamManagers.find(t => String(t?.managerID) === key);
    if (found?.teamName) return found.teamName;
    return found?.username || found?.name || null;
  }

  function isValidId(leagueTeamManagers, maybeId) {
    if (!maybeId) return false;
    const key = String(maybeId);
    return leagueTeamManagers?.some(
      t => String(t?.rosterID) === key || String(t?.managerID) === key
    );
  }

  // ---- Head-to-head summary helpers ----
  // This tries a couple of common shapes:
  //   recordsInfo.headToHead?.[idA]?.[idB] = { wins, losses, pointsFor, pointsAgainst }
  //   OR a flat array of games with { homeId, awayId, homeScore, awayScore }
  function computeH2H(recordsInfo, idA, idB) {
    const A = String(idA ?? '');
    const B = String(idB ?? '');
    if (!A || !B || !recordsInfo) return null;

    // 1) Nested map
    const map = recordsInfo?.headToHead;
    const lookup = map?.[A]?.[B];
    if (lookup) {
      const w = Number(lookup.wins ?? 0);
      const l = Number(lookup.losses ?? 0);
      const pf = Number(lookup.pointsFor ?? 0);
      const pa = Number(lookup.pointsAgainst ?? 0);
      return { w, l, pf, pa, games: w + l };
    }

    // 2) Flat games list
    const games = Array.isArray(recordsInfo?.games) ? recordsInfo.games : null;
    if (games) {
      let w = 0, l = 0, pf = 0, pa = 0, cnt = 0;
      for (const g of games) {
        const h = String(g.homeId ?? '');
        const a = String(g.awayId ?? '');
        if (!h || !a) continue;
        const hs = Number(g.homeScore ?? 0);
        const as = Number(g.awayScore ?? 0);

        // Only count direct meetings
        if ((h === A && a === B) || (h === B && a === A)) {
          cnt++;
          const aIsHome = h === A;
          const aScore = aIsHome ? hs : as;
          const bScore = aIsHome ? as : hs;
          pf += aScore;
          pa += bScore;
          if (aScore > bScore) w++; else if (aScore < bScore) l++;
        }
      }
      if (cnt > 0) return { w, l, pf, pa, games: cnt };
    }

    return null;
  }
</script>

<svelte:head>
  {#key reloadKey}
    {#await waitForAll(leagueTeamManagerData, playersData, transactionsData, recordsData)}
      <title>Rivalry — The League</title>
    {:then [leagueTeamManagers]}
      <title>
        Rivalry: {getDisplayName(leagueTeamManagers, id(playerOne)) || 'Team A'}
        vs {getDisplayName(leagueTeamManagers, id(playerTwo)) || 'Team B'} — The League
      </title>
    {:catch}
      <title>Rivalry — The League (Error)</title>
    {/await}
  {/key}
</svelte:head>

<style>
  .holder { position: relative; z-index: 1; }
  .loading, .error {
    display: block; width: 85%; max-width: 520px;
    margin: 80px auto; text-align: center;
  }
  .who {
    text-align: center; margin: 1.25rem auto 0.25rem;
    color: var(--g555); font-weight: 600;
  }
  .names { display: inline-flex; gap: .5rem; align-items: baseline; color: var(--g333); }
  .vs { color: var(--g555); opacity: .85; }
  .summary {
    text-align: center; margin: 0.2rem auto 1rem; color: var(--g555);
    font-size: .95rem;
  }
  .btn {
    margin-top: 14px; padding: 8px 12px; border-radius: 10px;
    border: 1px solid var(--borderOverride); background: #0f1216; color: var(--g000);
    cursor: pointer;
  }
  .btn:hover { box-shadow: 0 6px 20px rgba(0,0,0,.35); }
  .note { text-align: center; color: var(--g999); font-size: .9rem; margin: .5rem 0 1rem; }
</style>

<div class="holder">
  {#key reloadKey}
    {#await waitForAll(leagueTeamManagerData, playersData, transactionsData, recordsData)}
      <div class="loading" role="status" aria-live="polite">
        <p>Gathering information…</p>
        <br />
        <LinearProgress indeterminate aria-label="Loading rivalry data" />
      </div>

    {:then [leagueTeamManagers, playersInfo, transactionsInfo, recordsInfo]}
      {#if !isValidId(leagueTeamManagers, id(playerOne)) || !isValidId(leagueTeamManagers, id(playerTwo))}
        <div class="error">
          <p>Pick two valid teams to compare.</p>
          <p class="note">Tip: use URL params like <code>?one=ROSTER_ID&two=ROSTER_ID</code></p>
          <button class="btn" on:click={retry}>Reload</button>
        </div>
      {:else}
        <!-- Names -->
        <div class="who">
          <span class="names">
            {getDisplayName(leagueTeamManagers, id(playerOne))}
            <span class="vs">vs</span>
            {getDisplayName(leagueTeamManagers, id(playerTwo))}
          </span>
        </div>

        <!-- Head-to-head Summary -->
        {#if computeH2H(recordsInfo, id(playerOne), id(playerTwo)) as h2h}
          <div class="summary">
            H2H: <strong>{h2h.w}-{h2h.l}</strong>
            &nbsp;•&nbsp; PF/PA: <strong>{h2h.pf}</strong>/<strong>{h2h.pa}</strong>
            {#if h2h.games > 0}&nbsp;•&nbsp; Games: {h2h.games}{/if}
          </div>
        {:else}
          <div class="summary">No head-to-head results found yet.</div>
        {/if}

        <!-- Main component -->
        <Rivalry
          {leagueTeamManagers}
          {playersInfo}
          {transactionsInfo}
          {recordsInfo}
          playerOne={id(playerOne)}
          playerTwo={id(playerTwo)}
        />
      {/if}

    {:catch error}
      <div class="error">
        <p>Something went wrong: {error?.message || 'Unknown error'}</p>
        <button class="btn" on:click={retry}>Retry</button>
      </div>
    {/await}
  {/key}
</div>