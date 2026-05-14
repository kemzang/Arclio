<script context="module">
  import { getContext, setContext } from 'svelte';

  export function getTheme() {
    return getContext('theme');
  }

  export function initTheme(theme) {
    setContext('theme', theme);
  }
</script>

<script>
  import { onMount, onDestroy } from 'svelte';

  export let title = '';
  export let description = '';
  export let tags = [];
  export let pubDate = new Date();

  let expanded = false;
  let activeTag = null;
  let contentRef = null;
  let headings = [];

  const formattedDate = pubDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  function toggleExpand() {
    expanded = !expanded;
  }

  function selectTag(tag) {
    activeTag = activeTag === tag ? null : tag;
  }

  function buildHeadings(node) {
    const found = Array.from(node.querySelectorAll('h2, h3, h4'));
    headings = found.map((h) => ({
      id: h.textContent.toLowerCase().replace(/\s+/g, '-'),
      text: h.textContent,
      level: parseInt(h.tagName[1], 10),
    }));
    found.forEach((h, i) => {
      h.id = headings[i].id;
    });
  }

  onMount(() => {
    if (contentRef) {
      buildHeadings(contentRef);
    }
  });

  onDestroy(() => {
    headings = [];
    activeTag = null;
  });
</script>

<article class="post">
  <header class="post-header">
    <h1 class="post-title">{title}</h1>
    <p class="post-description">{description}</p>
    <time class="post-date" datetime={pubDate.toISOString()}>{formattedDate}</time>
    <ul class="post-tags">
      {#each tags as tag}
        <li
          class="post-tag"
          class:active={activeTag === tag}
          on:click={() => selectTag(tag)}
        >
          <a href={`/tags/${tag}`}>{tag}</a>
        </li>
      {/each}
    </ul>
  </header>

  <div class="post-content" bind:this={contentRef}>
    <slot />
  </div>

  {#if headings.length > 0}
    <nav class="toc">
      <h2>Table of Contents</h2>
      <ul>
        {#each headings as heading}
          <li class="toc-item toc-level-{heading.level}">
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}

  <button class="expand-btn" on:click={toggleExpand}>
    {expanded ? 'Show less' : 'Show more'}
  </button>

  {#if expanded}
    <aside class="meta-panel">
      <p>Published: {formattedDate}</p>
      <p>Tags: {tags.join(', ')}</p>
    </aside>
  {/if}
</article>

<style>
  .post {
    max-width: 768px;
    margin: 0 auto;
    padding: 2rem 1rem;
    font-family: sans-serif;
  }

  .post-header {
    margin-bottom: 2rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
  }

  .post-title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem;
  }

  .post-description {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0 0 1rem;
  }

  .post-date {
    font-size: 0.875rem;
    color: #9ca3af;
  }

  .post-tags {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .post-tag a {
    background: #f3f4f6;
    color: #374151;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    text-decoration: none;
  }

  .post-tag.active a {
    background: #2563eb;
    color: #fff;
  }

  .post-tag a:hover {
    background: #e5e7eb;
  }

  .post-content {
    line-height: 1.75;
    color: #374151;
  }

  .toc {
    margin-top: 2rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .toc h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }

  .toc ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .toc-item a {
    color: #2563eb;
    text-decoration: none;
    font-size: 0.875rem;
  }

  .toc-level-3 {
    padding-left: 1rem;
  }

  .toc-level-4 {
    padding-left: 2rem;
  }

  .expand-btn {
    margin-top: 1.5rem;
    padding: 0.5rem 1rem;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .expand-btn:hover {
    background: #1d4ed8;
  }

  .meta-panel {
    margin-top: 1rem;
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
  }
</style>
