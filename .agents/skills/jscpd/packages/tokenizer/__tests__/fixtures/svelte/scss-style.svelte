<script>
  let active = false;
  let theme = 'light';
</script>

<div class="container" class:active>
  <p>Styled component — theme: {theme}</p>
</div>

<style lang="scss">
  $primary: #333;
  $accent: steelblue;

  .container {
    color: $primary;
    padding: 1rem;
    border: 1px solid $accent;

    &.active {
      background: lighten($accent, 40%);
    }

    p {
      margin: 0;
      font-size: 1rem;
    }
  }
</style>

<style lang="sass">
  $secondary: #666
  $spacing: 0.5rem

  .sidebar
    color: $secondary
    padding: $spacing
    margin: 0
    font-style: italic
</style>
