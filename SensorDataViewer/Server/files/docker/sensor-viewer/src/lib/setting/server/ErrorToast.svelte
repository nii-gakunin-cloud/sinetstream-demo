<script lang="ts">
  export let timeout = 6000;
  export let message;
  export let position: "top" | "bottom" = "top";

  let classes = ["toast", "pink", "white-text", "active"];
  $: if (position === "top") {
    if (!classes.includes("top")) {
      classes = [...classes, "top"];
    }
  } else {
    if (classes.includes("top")) {
      classes = classes.filter((x) => x !== "top");
    }
  }

  if (timeout > 0) {
    setTimeout(() => {
      classes = classes.filter((x) => x !== "active");
    }, timeout);
  }
</script>

<div class={classes.join(" ")} aria-label="error-toast">
  <i>error</i>
  <span>{message}</span>
</div>
