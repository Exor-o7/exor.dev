document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".primary-nav");

  if (menu && navigation) {
    menu.hidden = false;
    const closeMenu = () => {
      menu.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    };
    menu.addEventListener("click", () => {
      const open = menu.getAttribute("aria-expanded") !== "true";
      menu.setAttribute("aria-expanded", String(open));
      navigation.classList.toggle("is-open", open);
    });
    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
        closeMenu();
        menu.focus();
      }
    });
    window.matchMedia("(min-width: 761px)").addEventListener("change", closeMenu);
  }

  // Keep the displayed order stable when adding or changing project statuses.
  const statusOrder = { active: 0, wip: 1, released: 2 };
  document.querySelectorAll(".explore-grid, .project-list").forEach((list) => {
    const cards = Array.from(list.querySelectorAll(":scope > [data-status]"));
    cards.sort((a, b) => (statusOrder[a.dataset.status] ?? 3) - (statusOrder[b.dataset.status] ?? 3));
    cards.forEach((card) => list.appendChild(card));
  });

  const controls = document.querySelector(".project-controls");
  if (!controls) return;
  const search = document.querySelector("#project-search");
  const buttons = Array.from(controls.querySelectorAll("[data-filter]"));
  const projects = Array.from(document.querySelectorAll("[data-project]"));
  const count = document.querySelector("#project-count");
  const empty = document.querySelector("#empty-state");
  let category = "All";

  const filterProjects = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    projects.forEach((project) => {
      const categories = project.dataset.categories.split(" ");
      const matchesCategory = category === "All" || categories.includes(category);
      const matchesSearch = (project.textContent + " " + project.dataset.categories)
        .toLocaleLowerCase().includes(query);
      project.hidden = !(matchesCategory && matchesSearch);
      if (!project.hidden) visible += 1;
    });
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === category)));
    count.textContent = `${visible} ${visible === 1 ? "project" : "projects"}`;
    empty.hidden = visible !== 0;
  };

  buttons.forEach((button) => button.addEventListener("click", () => {
    category = button.dataset.filter;
    filterProjects();
  }));
  search.addEventListener("input", filterProjects);
  document.querySelector("#reset-projects").addEventListener("click", () => {
    category = "All";
    search.value = "";
    filterProjects();
    search.focus();
  });
  controls.hidden = false;
  filterProjects();
});
