<script>
  import LinearProgress from '@smui/linear-progress';
  import { Records } from '$lib/components';

  export let data;
  const recordsInfo = data.recordsInfo;
</script>

<style>
  #main {
    position: relative;
    z-index: 1;
  }
  .loading {
    display: block;
    width: 85%;
    max-width: 500px;
    margin: 80px auto;
    text-align: center;
  }
</style>

<div id="main">
  {#await recordsInfo}
    <!-- pending -->
    <div class="loading" role="status" aria-live="polite">
      <p>Loading league records…</p>
      <LinearProgress indeterminate aria-label="Loading" />
    </div>

  {:then payload}
    <!-- Support either a 3-item or 4-item tuple -->
    {@const arr = Array.isArray(payload) ? payload : []}
    {@const [leagueData, tx = {}, leagueTeamManagers, _legacy] = arr}
    {@const totals = tx?.totals ?? {}}
    {@const stale  = tx?.stale  ?? false}

    <!-- Hand off to Records; remains unchanged if you merge legacy inside leagueData -->
    <Records {leagueData} {totals} {stale} {leagueTeamManagers} />

  {:catch error}
    <!-- rejected -->
    <div class="loading" role="alert">
      <p>Something went wrong: {error?.message ?? 'Unknown error'}</p>
    </div>
  {/await}
</div>