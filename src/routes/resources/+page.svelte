<script>
  import LinearProgress from '@smui/linear-progress';
  import { News, Resources } from '$lib/components';

  export let data;

  // Required: a Promise (unchanged from your version)
  const articlesData = data.articlesData;

  // Optional: if you pass a function that re-fetches, we'll call it on retry
  const refreshArticles = typeof data?.refreshArticles === 'function' ? data.refreshArticles : null;

  // internal key to re-run the await block
  let reloadKey = 0;
  async function retry() {
    try {
      if (refreshArticles) await refreshArticles();
    } finally {
      reloadKey += 1;
    }
  }

  // lightweight client-side filter
  let q = '';
  function normalizeArray(x) {
    if (!x) return [];
    if (Array.isArray(x)) return x;
    // try common shapes
    if (Array.isArray(x.items)) return x.items;
    if (Array.isArray(x.articles)) return x.articles;
    return [];
  }
  function matches(article, query) {
    if (!query) return true;
    const hay = [
      article?.title,
      article?.article || article?.body || article?.content,
      article?.author
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(query.toLowerCase());
  }
</script>

<svelte:head>
  <title>News — The League</title>
</svelte:head>

<style>
  .loading, .error, .empty {
    position: relative;
    z-index: 1;
    width: 85%;
    margin: 0 auto 60px;
    max-width: 800px;
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
  }
  .search {
    flex: 1;
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
  hr { margin: 18px 0 24px; border-color: var(--borderOverride); }
</style>

<Resources />

<hr />

{#key reloadKey}
  {#await articlesData}
    <div class="loading" role="status" aria-live="polite">
      <p>Retrieving fantasy news…</p>
      <br />
      <LinearProgress indeterminate aria-label="Loading news" />
    </div>
  {:then raw}
    {#if normalizeArray(raw).length === 0}
      <div class="empty">
        <p>No news articles right now. Try again in a bit.</p>
        <button class="btn" on:click={retry}>Retry</button>
      </div>
    {:else}
      <!-- Controls -->
      <div class="controls">
        <input
          class="search"
          type="search"
          placeholder="Search news (title, body, author)…"
          bind:value={q}
          aria-label="Search news"
        />
        <div class="meta">
          {normalizeArray(raw).filter(a => matches(a, q)).length} / {normalizeArray(raw).length}
        </div>
        <button class="btn" on:click={() => (q = '')} aria-label="Clear search">Clear</button>
        <button class="btn" on:click={retry} aria-label="Refresh news">Refresh</button>
      </div>

      <!-- Render -->
      <News news={normalizeArray(raw).filter(a => matches(a, q))} />
    {/if}
  {:catch error}
    <div class="error">
      <p>Something went wrong: {error?.message || 'Unknown error'}</p>
      <button class="btn" on:click={retry}>Retry</button>
    </div>
  {/await}
{/key}