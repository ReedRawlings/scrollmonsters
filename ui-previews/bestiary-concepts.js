(() => {
  "use strict";

  const canvas = document.getElementById("preview");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const WIDTH = 540;
  const HEIGHT = 900;
  const variants = ["warm", "muted", "light"];
  let variant = new URLSearchParams(location.search).get("variant") || "warm";
  if (!variants.includes(variant)) variant = "warm";
  let time = 0;
  let ready = false;

  const wood = "../assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/";
  const paths = {
    coinSheet: "../assets/Ninja Adventure - Asset Pack/Items/Treasure/Coin2-Sheet.png",
    petRoster: "../assets/Sprites/Pets/minimize_F-Sheet.png",
    panel: `${wood}nine_path_panel.png`,
    panel2: `${wood}nine_path_panel_2.png`,
    panel3: `${wood}nine_path_panel_3.png`,
    panelDisabled: `${wood}nine_path_panel_disabled.png`,
    cell: `${wood}inventory_cell.png`,
    tabSelected: `${wood}tab_selected.png`,
    tabUnselected: `${wood}tab_unselected.png`,
    button: `${wood}button_normal.png`,
    buttonHover: `${wood}button_hover.png`,
    buttonDisabled: `${wood}button_disabled.png`
  };
  const images = {};
  const loads = Object.entries(paths).map(([key, path]) => new Promise(resolve => {
    const image = new Image();
    image.onload = () => { images[key] = image; resolve(); };
    image.onerror = resolve;
    image.src = path;
  }));

  const schemes = {
    warm: {
      label: "Warm Wood", bg: "#5c9855", road: "#b8895a", speck: "#5b6844",
      title: "#fff0b0", text: "#fff5d7", muted: "#e2ccb0", dark: "#30221a", locked: "#463c32", accent: "#ffd36b"
    },
    muted: {
      label: "Muted Wood", bg: "#5c9855", road: "#a97b50", speck: "#526044",
      title: "#fff4d5", text: "#fff4d5", muted: "#d8c3a8", dark: "#30221a", locked: "#463c32", accent: "#ff9b55"
    },
    light: {
      label: "Light Wood", bg: "#5c9855", road: "#b8895a", speck: "#5b6844",
      title: "#30221a", text: "#30221a", muted: "#625344", activeMuted: "#e2ccb0", dark: "#30221a", locked: "#463c32", accent: "#ad532f"
    }
  };
  const affinities = [
    { name: "Feral", value: 34, color: "#ef5266", icon: 1 },
    { name: "Bloom", value: 18, color: "#4ac56b", icon: 2 },
    { name: "Arcane", value: 7, color: "#5ed5f2", icon: 3 }
  ];
  const creatures = [
    { id: "striker", name: "Fangle", affinity: "Feral", role: "Striker", status: "active", detail: "Ground traps target wounded monsters." },
    { id: "healer", name: "Buttermant", affinity: "Bloom", role: "Healer", status: "reserve", detail: "Restores the party's shared health." },
    { id: "aoe", name: "Tinmin", affinity: "Arcane", role: "Area", status: "locked", detail: "Clear stage 10 to unlock recruitment." }
  ];

  function text(value, x, y, size = 18, color = schemes[variant].text, align = "left", shadow = true) {
    ctx.font = `${size}px NinjaPixel, monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    if (shadow) {
      ctx.fillStyle = "#241b17";
      ctx.fillText(value, x + 2, y + 2);
    }
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }

  function nineSlice(image, x, y, width, height, borderX = 7, borderY = 7, pixelScale = 2) {
    if (!image?.naturalWidth) return;
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const sourceBorderX = Math.min(borderX, Math.floor(sourceWidth / 2));
    const sourceBorderY = Math.min(borderY, Math.floor(sourceHeight / 2));
    const targetBorderX = sourceBorderX * pixelScale;
    const targetBorderY = sourceBorderY * pixelScale;
    const centerSourceWidth = sourceWidth - sourceBorderX * 2;
    const centerSourceHeight = sourceHeight - sourceBorderY * 2;
    const centerWidth = width - targetBorderX * 2;
    const centerHeight = height - targetBorderY * 2;

    ctx.drawImage(image, 0, 0, sourceBorderX, sourceBorderY, x, y, targetBorderX, targetBorderY);
    ctx.drawImage(image, sourceWidth - sourceBorderX, 0, sourceBorderX, sourceBorderY, x + width - targetBorderX, y, targetBorderX, targetBorderY);
    ctx.drawImage(image, 0, sourceHeight - sourceBorderY, sourceBorderX, sourceBorderY, x, y + height - targetBorderY, targetBorderX, targetBorderY);
    ctx.drawImage(image, sourceWidth - sourceBorderX, sourceHeight - sourceBorderY, sourceBorderX, sourceBorderY, x + width - targetBorderX, y + height - targetBorderY, targetBorderX, targetBorderY);
    ctx.drawImage(image, sourceBorderX, 0, centerSourceWidth, sourceBorderY, x + targetBorderX, y, centerWidth, targetBorderY);
    ctx.drawImage(image, sourceBorderX, sourceHeight - sourceBorderY, centerSourceWidth, sourceBorderY, x + targetBorderX, y + height - targetBorderY, centerWidth, targetBorderY);
    ctx.drawImage(image, 0, sourceBorderY, sourceBorderX, centerSourceHeight, x, y + targetBorderY, targetBorderX, centerHeight);
    ctx.drawImage(image, sourceWidth - sourceBorderX, sourceBorderY, sourceBorderX, centerSourceHeight, x + width - targetBorderX, y + targetBorderY, targetBorderX, centerHeight);
    ctx.drawImage(image, sourceBorderX, sourceBorderY, centerSourceWidth, centerSourceHeight, x + targetBorderX, y + targetBorderY, centerWidth, centerHeight);
  }

  function pet(type, x, y, size = 64, alpha = 1) {
    const image = images.petRoster;
    const row = { striker: 0, healer: 1, aoe: 2 }[type];
    if (!image?.naturalWidth || row === undefined) return;
    const frame = Math.floor(time * 8) % 4;
    const southFacingColumn = frame * 3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, southFacingColumn * 16, row * 32, 16, 16, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }

  function currencyIcon(index, x, y, size = 30) {
    const image = images.coinSheet;
    if (!image?.naturalWidth) return;
    const sourceSize = 10;
    const frame = 0;
    ctx.drawImage(image, frame * sourceSize, index * sourceSize, sourceSize, sourceSize, x - size / 2, y - size / 2, size, size);
  }

  function background() {
    const scheme = schemes[variant];
    ctx.fillStyle = scheme.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = scheme.road;
    ctx.fillRect(57, 0, 426, HEIGHT);
    ctx.fillStyle = `${scheme.speck}66`;
    for (let y = 0; y < HEIGHT; y += 24) for (let x = 0; x < WIDTH; x += 24) {
      if ((x / 24 + y / 24) % 3 === 0) ctx.fillRect(x + 3, y + 6, 3, 3);
    }
  }

  function surface(x, y, width, height, state = "normal", kind = "card") {
    const family = variant === "warm" ? images.panel : variant === "muted" ? images.panel2 : images.panel3;
    const image = kind === "slot" ? images.cell : state === "locked" ? images.panelDisabled : state === "selected" && variant !== "warm" ? images.panel : family;
    nineSlice(image, x, y, width, height);
  }

  function button(label, x, y, width, height, state = "normal") {
    const scheme = schemes[variant];
    const image = state === "selected" ? images.buttonHover : state === "locked" ? images.buttonDisabled : images.button;
    nineSlice(image, x, y, width, height, 7, 3, 2);
    text(label, x + width / 2, y + height / 2, 15, state === "locked" ? scheme.locked : scheme.dark, "center", false);
  }

  function tab(label, x, y, width, selected = false) {
    nineSlice(selected ? images.tabSelected : images.tabUnselected, x, y, width, 42, 7, 5, 2);
    text(label, x + width / 2, y + 21, 15, selected ? "#30221a" : "#fff4d5", "center", false);
  }

  function header() {
    const scheme = schemes[variant];
    surface(15, 15, 510, 72, "normal", "shell");
    text("BESTIARY", 33, 51, 30, scheme.title);
    affinities.forEach((affinity, index) => {
      const x = 273 + index * 87;
      currencyIcon(affinity.icon, x, 51, 30);
      text(String(affinity.value), x + 21, 51, 18, affinity.color, "left", false);
    });
  }

  function partySlots() {
    const scheme = schemes[variant];
    surface(18, 99, 504, 126, "normal", "shell");
    text("ACTIVE PARTY", 36, 120, 18, scheme.accent, "left", false);
    for (let index = 0; index < 3; index++) {
      const x = 36 + index * 160;
      surface(x, 141, 136, 70, index === 0 ? "selected" : "normal", "slot");
      if (index === 0) pet("striker", x + 68, 176, 48);
      else text("EMPTY", x + 68, 176, 15, scheme.muted, "center");
    }
  }

  function filterTabs() {
    affinities.forEach((affinity, index) => tab(affinity.name.toUpperCase(), 18 + index * 171, 237, 162, index === 0));
  }

  function creatureCard(creature, index) {
    const scheme = schemes[variant];
    const y = 291 + index * 129;
    const state = creature.status === "locked" ? "locked" : creature.status === "active" ? "selected" : "normal";
    const lightOnDark = variant !== "light" || creature.status === "active";
    const nameColor = creature.status === "locked" ? scheme.locked : lightOnDark ? "#fff5d7" : scheme.text;
    const detailColor = creature.status === "locked" ? scheme.locked : lightOnDark ? (scheme.activeMuted || scheme.muted) : scheme.muted;
    surface(18, y, 504, 120, state, "card");
    pet(creature.id, 72, y + 60, 64, creature.status === "locked" ? 0.35 : 1);
    text(creature.name, 111, y + 27, 21, nameColor, "left", lightOnDark && creature.status !== "locked");
    const affinity = affinities.find(item => item.name === creature.affinity);
    currencyIcon(affinity.icon, 120, y + 60, 20);
    text(`${creature.affinity} • ${creature.role}`, 138, y + 60, 15, creature.status === "locked" ? scheme.locked : affinity.color, "left", false);
    text(creature.detail, 111, y + 90, 15, detailColor, "left", lightOnDark && creature.status !== "locked");
    const label = creature.status === "active" ? "ACTIVE" : creature.status === "reserve" ? "ADD TO PARTY" : "LOCKED";
    button(label, 354, y + 12, 150, 36, creature.status === "active" ? "selected" : creature.status === "locked" ? "locked" : "normal");
  }

  function footer() {
    const scheme = schemes[variant];
    text("Choose up to three creatures for your active party", WIDTH / 2, 792, 15, scheme.muted, "center");
    button("BACK TO MAP", 99, 819, 342, 42);
  }

  function render() {
    background();
    header();
    partySlots();
    filterTabs();
    creatures.forEach(creatureCard);
    footer();
  }

  document.addEventListener("keydown", event => {
    if (event.key.toLowerCase() === "f") {
      if (!document.fullscreenElement) canvas.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
  });

  window.render_game_to_text = () => JSON.stringify({
    mode: "ui-review",
    variant,
    variantLabel: schemes[variant].label,
    coordinateSystem: "origin top-left; x east; y south; canvas 540x900",
    currencies: affinities.map(({ name, value }) => ({ name, value })),
    activeParty: ["Fangle", null, null],
    cards: creatures.map(({ name, affinity, role, status }) => ({ name, affinity, role, status })),
    note: "Warm Wood concept. Creatures use the south-facing in-game walk cycle. All sprite and icon scaling uses integer multiples."
  });
  window.advanceTime = ms => {
    time += ms / 1000;
    if (ready) render();
  };

  const previewGlyphs = "BESTIARY ACTIVE PARTY EMPTY FERAL BLOOM ARCANE Fangle Buttermant Tinmin Striker Healer Area Ground traps target wounded monsters Restores shared health Clear stage unlock recruitment ADD TO PARTY LOCKED BACK MAP 0123456789";
  Promise.all([
    Promise.all(loads),
    ...[15, 18, 21, 30].map(size => document.fonts?.load(`${size}px "NinjaPixel"`, previewGlyphs))
  ]).then(() => {
    ready = true;
    render();
    ctx.getImageData(0, 0, 1, 1);
    render();
  });
})();
