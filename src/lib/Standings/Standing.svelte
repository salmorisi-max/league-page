<script>
  import { gotoManager } from '$lib/utils/helper';
  import { Row, Cell } from '@smui/data-table';

  export let columnOrder;
  export let team;
  export let standing;
  export let leagueTeamManagers;

  // Fallbacks
  const rosterID = standing?.rosterID;
  const teamName = team?.name || `Team ${rosterID ?? ''}`.trim();
  const avatarSrc =
    team?.avatar && String(team.avatar).length
      ? team.avatar
      : '/managers/everyone.png';

  // Formatting helper: supports built-ins or a custom formatter function on column
  const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const pf = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });
  const f1 = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function fmt(val, column) {
    if (!column) return val ?? '';
    if (typeof column.format === 'function') return column.format(val, standing, column);

    switch (column.format) {
      case 'number':
        return typeof val === 'number' ? nf.format(val) : (val ?? '');
      case 'percent': {
        // Accept 0–1 or 0–100 inputs
        if (typeof val !== 'number') return val ?? '';
        const v = val > 1 ? val / 100 : val;
        return pf.format(v);
      }
      case 'fixed1':
        return typeof val === 'number' ? f1.format(val) : (val ?? '');
      default:
        return val ?? '';
    }
  }

  // Navigation
  function openTeam() {
    if (rosterID != null) {
      gotoManager({ leagueTeamManagers, rosterID });
    }
  }

  // Keyboard support
  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openTeam();
    }
  }
</script>

<style>
  .clickable {
    cursor: pointer;
  }

  .teamCell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .teamAvatar {
    vertical-align: middle;
    border-radius: 50%;
    height: 40px;
    width: 40px;
    object-fit: cover;
    border: 0.5px solid #777;
    flex: 0 0 auto;
  }

  .teamName {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.contrastRow) {
    background-color: var(--f8f8f8);
  }

  /* Hover & focus polish */
  :global(.mdc-data-table__row.clickable:hover) {
    background: rgba(0,0,0,0.04);
  }
  :global(.mdc-data-table__row.clickable:focus-visible) {
    outline: 2px solid var(--blueOne, #4da3ff);
    outline-offset: -2px;
  }

  .center {
    text-align: center;
  }

  /* Better touch target inside the first cell wrapper */
  .teamButton {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    justify-content: center;
  }
</style>

<Row
  class="contrastRow clickable"
  role="button"
  tabindex="0"
  aria-label={"Open " + teamName + " manager page"}
  on:click={openTeam}
  on:keydown={onKey}
>
  <Cell class="team">
    <div class="teamButton">
      <img
        alt={teamName + " avatar"}
        class="teamAvatar"
        src={avatarSrc}
        loading="lazy"
        decoding="async"
      />
      <div class="teamName">{teamName}</div>
    </div>
  </Cell>

  {#each columnOrder as column}
    <Cell class="center">
      {fmt(standing?.[column.field], column)}
    </Cell>
  {/each}
</Row>