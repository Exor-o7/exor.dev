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

  const featured = document.querySelector(".featured-grid");
  if (featured) {
    // Keep useful HTML for direct-file/no-JS previews; refresh from the directory when served.
    const fallback = Array.from(featured.querySelectorAll(".featured-card"));
    const preferred = new Map(fallback.map((card, index) => [card.hash.slice(1), index]));
    const featuredOrder = { wip: 0, active: 1, released: 2 };
    const arrow = featured.querySelector("h3 svg");
    const refreshFeatured = async () => {
      try {
        const response = await fetch("projects.html");
        if (!response.ok) return;
        const directory = new DOMParser().parseFromString(await response.text(), "text/html");
        const projects = Array.from(directory.querySelectorAll("[data-project]"));
        const titleFor = (project) => project.querySelector(".project-header [id]");
        const candidates = projects.filter((project) => titleFor(project));
        candidates.sort((a, b) =>
          (featuredOrder[a.dataset.status] ?? 3) - (featuredOrder[b.dataset.status] ?? 3)
          || (preferred.get(titleFor(a).id) ?? projects.length) - (preferred.get(titleFor(b).id) ?? projects.length));
        if (!candidates.length) return;
        const cards = candidates.slice(0, 3).map((project) => {
          const title = titleFor(project);
          const card = document.createElement("a");
          card.className = "featured-card";
          card.href = `projects.html#${title.id}`;
          card.dataset.status = project.dataset.status;
          const status = document.createElement("span");
          status.className = "featured-status";
          status.textContent = project.querySelector(".status-pill").textContent;
          const heading = document.createElement("h3");
          heading.textContent = title.textContent.trim();
          if (arrow) heading.appendChild(arrow.cloneNode(true));
          const summary = document.createElement("p");
          const original = fallback.find((item) => item.hash === `#${title.id}`);
          summary.textContent = (original?.querySelector("p") || project.querySelector("p")).textContent.trim();
          card.append(status, heading, summary);
          const tags = project.querySelector(".project-tags");
          if (tags) card.appendChild(tags.cloneNode(true));
          return card;
        });
        featured.replaceChildren(...cards);
        document.querySelectorAll("[data-project-total]").forEach((element) => {
          element.textContent = String(projects.length);
        });
      } catch {
        // Local files and offline previews retain the static featured cards.
      }
    };
    refreshFeatured();
  }

  const controls = document.querySelector(".project-controls");
  if (!controls) return;
  const search = document.querySelector("#project-search");
  const buttons = Array.from(controls.querySelectorAll("[data-filter]"));
  const projects = Array.from(document.querySelectorAll("[data-project]"));
  document.querySelectorAll("[data-project-total]").forEach((element) => {
    element.textContent = String(projects.length);
  });
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
  document.querySelectorAll(".header-search").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      search.focus();
    });
  });
});
