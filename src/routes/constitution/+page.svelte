<script>
  import { dues } from '$lib/utils/helper';
  import { onMount, onDestroy } from 'svelte';

  let rootEl;

  const goToEl = (el) => {
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top, behavior: 'smooth' });
  };
  const keyNav = (e, el) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToEl(el);
    }
  };
  const backToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // ---- Auto-number + TOC generation ----
  let toc = [];     // [{id, title, number, level, el}]
  let activeId = '';

  function slugify(s) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function stripLeadingNumbers(s) {
    // remove "1.2.3 " or "1) " or "1 - " etc
    return (s || '').replace(/^\s*\d+(?:[\.\)])?(?:\d+(?:[\.\)])?)*\s*[-–:]?\s*/i, '').trim();
  }

  function buildOutline() {
    toc = [];
    if (!rootEl) return;

    const headings = Array.from(rootEl.querySelectorAll('h2, h3, h4'));
    const levelOf = (tag) => (tag === 'H2' ? 1 : tag === 'H3' ? 2 : 3);
    const counters = [0, 0, 0]; // levels 1..3

    headings.forEach((h) => {
      const level = levelOf(h.tagName);
      counters[level - 1] += 1;
      for (let i = level; i < counters.length; i++) counters[i] = 0;

      const parts = counters.slice(0, level).filter((n) => n > 0);
      const number = parts.join('.');

      const raw = h.textContent || '';
      const cleaned = stripLeadingNumbers(raw);
      h.innerHTML = `<span class="hnum">${number}</span> ${cleaned}`;

      const base = slugify(cleaned) || `section-${number.replace(/\./g, '-')}`;
      let id = base;
      let k = 2;
      while (document.getElementById(id)) id = `${base}-${k++}`;
      h.id = id;
      h.dataset.tocid = id;

      toc.push({ id, title: cleaned, number, level, el: h });
    });

    activeId = toc[0]?.id || '';
  }

  // Intersection observer for active highlight
  let observer;
  function onIntersect(entries) {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
    if (visible[0]) {
      activeId = visible[0].target.id;
    }
  }
  function setupObserver() {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: '0px 0px -70% 0px',
      threshold: [0, 1.0]
    });
    toc.forEach((t) => observer.observe(t.el));
  }

  onMount(() => {
    buildOutline();
    setupObserver();
  });
  onDestroy(() => observer && observer.disconnect());
</script>

<style>
  .layout {
    display: grid;
    grid-template-columns: 1fr minmax(0,800px) 280px;
    gap: 28px;
    align-items: start;
    width: 100%;
    margin: 0 auto;
    padding: 0 18px;
  }

  .constitution {
    position: relative;
    z-index: 1;
    width: 100%;
    margin: 8em auto 10em;
  }

  /* Number bubble on headings */
  .hnum {
    display: inline-block;
    min-width: 2.2ch;
    padding: 2px 8px;
    margin-right: 8px;
    border-radius: 8px;
    background: rgba(212,175,55,0.12);
    border: 1px solid rgba(212,175,55,0.25);
    color: #ffe7a6;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  /* Sticky TOC (desktop) */
  .toc {
    position: sticky;
    top: 96px;
    max-height: calc(100vh - 120px);
    overflow: auto;
    padding: 14px 12px;
    border: 1px solid var(--borderOverride);
    border-radius: 10px;
    background: #0e0f11;
  }
  .toc h4 {
    margin: 0 0 8px;
    font-size: 0.95rem;
    color: #e8d18a;
  }
  .toc ul { list-style: none; padding: 0; margin: 0; }
  .toc li { margin: 4px 0; }

  .toc-btn {
    width: 100%;
    text-align: left;
    background: transparent;
    color: var(--g555);
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
  }
  .toc-btn:hover { color: var(--g333); background: rgba(212,175,55,0.06); }
  .toc-btn:focus-visible { outline: 2px solid var(--blueOne); outline-offset: 2px; }
  .toc-btn.active {
    color: #ffe7a6;
    background: rgba(212,175,55,0.12);
    border-color: rgba(212,175,55,0.25);
  }
  .toc-small { font-size: 0.85rem; opacity: 0.9; }
  .toc-indent-2 { padding-left: 14px; }
  .toc-indent-3 { padding-left: 28px; }

  /* Mobile compact TOC */
  @media (max-width: 1099px) {
    .layout { grid-template-columns: 1fr minmax(0,800px); gap: 0; }
    .toc { display: none; }
    .mobile-toc { display: flex; }
  }
  .mobile-toc {
    position: sticky;
    bottom: 12px;
    margin: 24px auto 0;
    display: none;
    max-width: 800px;
    justify-content: space-between;
    gap: 8px;
    z-index: 5;
  }
  .chip {
    flex: 1;
    text-align: center;
    border: 1px solid var(--borderOverride);
    background: rgba(0,0,0,0.5);
    color: var(--g333);
    padding: 10px 12px;
    border-radius: 999px;
    cursor: pointer;
  }
  .chip:hover { color: var(--g000); }

  /* Your existing text styles */
  h1 { font-size: 2em; line-height: 1.2em; text-align: center; margin: 2em 0 1.5em; }
  h2 { font-size: 1.5em; line-height: 1.2em; }
  h3 { text-decoration: underline; font-size: 1.3em; line-height: 1.2em; }
  h4 { text-decoration: underline; margin-left: 2em; font-size: 1.2em; line-height: 1.2em; }
  h5 { margin-left: 6em; font-size: 0.8em; line-height: 1.1em; }
  .subBlock { margin-left: 2.4em; }
  .sectionHeading { margin: 4em 0 1.5em; }
  .subSectionHeading { margin: 1.5em 0 1.5em; }
  .underscore { text-decoration: underline; }
  .right { text-align: right; }
  .positionMaximums td { min-width: 3em; }
  .noUnderscore { text-decoration: none; }
  .clickable { cursor: pointer; }
  .clickable:hover { color: var(--blueOne); }
  p { color: #777; }

  .backTop {
    position: fixed;
    right: 18px;
    bottom: 18px;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--borderOverride);
    background: #0f1216;
    color: var(--g000);
    cursor: pointer;
    z-index: 10;
  }
  .backTop:hover { box-shadow: 0 6px 20px rgba(0,0,0,.35); }
</style>

<div class="layout">
  <div></div>

  <!-- MAIN -->
  <div class="constitution" bind:this={rootEl}>
    <h1 class="noUnderscore">THE LEAGUE CONSTITUTION</h1>

    <!-- Keep your content below, with plain H2/H3/H4 headings (no manual numbers).
         Example starter from your earlier content: -->

    <h2 class="sectionHeading">Section 1 Roster Breakdown</h2>

    <h3 class="subSectionHeading">Positional Breakdown</h3>
    <p>28 Total Players</p>
    <p class="underscore">Starters</p>
    <ul>
      <li>QB</li>
      <li>RB</li>
      <li>RB</li>
      <li>WR</li>
      <li>WR</li>
      <li>TE</li>
      <li>FLEX (RB/WR/TE)</li>
      <li>FLEX (RB/WR)</li>
      <li>D/ST</li>
      <li>K</li>
    </ul>
    <p>18 Bench (expanded by 5 between the league draft and the start of the regular season)</p>
    <p>1 IR spot (player must be labeled as IR, Out, or Covid in the Sleeper app)</p>

    <h4>Position Maximums</h4>
    <!-- …continue with your full constitution content exactly as before… -->

    <!-- Mobile compact TOC -->
    <div class="mobile-toc">
      <div class="chip" on:click={backToTop}>Top</div>
      {#each toc.slice(0,7) as t}
        <div class="chip" on:click={() => goToEl(t.el)}>{t.number}</div>
      {/each}
    </div>
  </div>

  <!-- STICKY TOC -->
  <aside class="toc" aria-label="Mini Table of Contents">
    <h4>On this page</h4>
    <ul>
      {#each toc as t}
        <li class={"toc-indent-" + t.level}>
          <button
            class={"toc-btn " + (activeId === t.id ? 'active' : '') + (t.level > 1 ? ' toc-small' : '')}
            on:click={() => goToEl(t.el)}
            on:keydown={(e) => keyNav(e, t.el)}
          >
            {t.number} {t.title}
          </button>
        </li>
      {/each}
    </ul>
  </aside>
</div>

<button class="backTop" on:click={backToTop} aria-label="Back to top">↑ Top</button>