<script context="module">
  export const prerender = true;

  export function load({ fetch }) {
    return fetch('/api/data')
      .then((r) => r.json())
      .then((data) => ({ props: { data } }));
  }

  export function formatTitle(title) {
    return title.trim().toUpperCase();
  }
</script>

<main>
  <h1>Module Script Component</h1>
  <p>This component only has a module script block.</p>
</main>
