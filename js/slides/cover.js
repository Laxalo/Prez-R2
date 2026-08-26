export function render(slide) {
  const meta = [slide.client, slide.date].filter(Boolean).join(" · ");
  return `
    <div class="cover">
      <img class="cover__logo" src="assets/logo-transparent.png" alt="Logo">
      ${slide.kicker ? `<p class="cover__kicker">${slide.kicker}</p>` : ""}
      <h1 class="cover__title">${slide.title}</h1>
      ${meta ? `<p class="cover__meta">${meta}</p>` : ""}
    </div>
  `;
}
