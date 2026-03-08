document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const command = document.querySelector(".hero .prompt span");
  const panels = document.querySelectorAll(".content .panel");

  if (!command) {
    return;
  }

  const revealPanels = () => {
    panels.forEach((panel, index) => {
      panel.classList.add("index-reveal");

      window.setTimeout(() => {
        panel.classList.add("is-visible");
      }, 90 * index);
    });
  };

  if (prefersReducedMotion) {
    revealPanels();
    return;
  }

  const fullText = command.textContent.trim();
  command.textContent = "";
  command.classList.add("typing-cursor");

  let index = 0;

  const typeNextCharacter = () => {
    if (index < fullText.length) {
      command.textContent += fullText[index];
      index += 1;
      window.setTimeout(typeNextCharacter, 90);
      return;
    }

    window.setTimeout(() => {
      command.classList.remove("typing-cursor");
      revealPanels();
    }, 180);
  };

  typeNextCharacter();
});
