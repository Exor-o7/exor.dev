document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const command = document.querySelector(".hero .prompt span");
  const heroRevealElements = document.querySelectorAll(".hero-reveal");
  const panels = document.querySelectorAll(".content .panel");

  if (!command) {
    return;
  }

  const revealElements = (elements, stepDelay, done) => {
    elements.forEach((element, index) => {
      window.setTimeout(() => {
        element.classList.add("is-visible");
      }, stepDelay * index);
    });

    if (done) {
      window.setTimeout(done, stepDelay * elements.length + 40);
    }
  };

  const revealPanels = () => {
    revealElements(panels, 90);
  };

  if (prefersReducedMotion) {
    heroRevealElements.forEach((element) => element.classList.add("is-visible"));
    panels.forEach((panel) => panel.classList.add("is-visible"));
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
      revealElements(heroRevealElements, 90, revealPanels);
    }, 180);
  };

  typeNextCharacter();
});
