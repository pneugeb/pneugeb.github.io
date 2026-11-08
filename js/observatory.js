/* A rotating pixel Earth, with repeatable worlds derived from the actual article categories. */
(function () {
  "use strict";

  var TAU = Math.PI * 2;
  var TEXTURE_WIDTH = 512;
  var TEXTURE_HEIGHT = 256;
  var bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var filters = document.querySelectorAll(".category-button");
  var entries = Array.prototype.map.call(document.querySelectorAll(".essay-list > li"), function (element) {
    return { element: element, categories: JSON.parse(element.dataset.categories || "[]") };
  });
  var canvas = document.getElementById("planet-canvas");
  var selected = "";
  var renderer;
  var surfaceRenderer;

  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      var category = button.dataset.category;
      if (category === selected) return;
      selected = category;
      var count = 0;
      entries.forEach(function (entry) {
        var visible = !category || entry.categories.indexOf(category) !== -1;
        entry.element.hidden = !visible;
        if (visible) count++;
      });
      filters.forEach(function (item) {
        var active = item.dataset.category === category;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      document.getElementById("entry-count").textContent = String(count).padStart(2, "0");
      document.getElementById("filter-status").textContent = "Showing " + count + (count === 1 ? " entry" : " entries") + (category ? " in " + category : " across all topics") + ".";
      if (renderer) renderer.setCategory(category);
      if (surfaceRenderer) surfaceRenderer.setCategory(category);
    });
  });
  document.querySelectorAll(".category-filter").forEach(function (filter) { filter.hidden = false; });

  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function mix(a, b, amount) { return a + (b - a) * amount; }
  function smooth(low, high, value) {
    var t = clamp((value - low) / (high - low), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function hash(x, y, seed) {
    var n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  function categorySeed(category) {
    // Hash the name itself, never its position in the category list.
    var key = category.normalize("NFKC").trim().toLowerCase();
    var value = 2166136261;
    for (var i = 0; i < key.length; i++) value = Math.imul(value ^ key.charCodeAt(i), 16777619);
    return value >>> 0;
  }
  function noise(x, y, seed) {
    var ix = Math.floor(x), iy = Math.floor(y);
    var fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    return mix(mix(hash(ix, iy, seed), hash(ix + 1, iy, seed), fx), mix(hash(ix, iy + 1, seed), hash(ix + 1, iy + 1, seed), fx), fy);
  }
  function hsl(hue, saturation, lightness) {
    var h = ((hue % 360) + 360) % 360 / 360;
    var s = saturation / 100, l = lightness / 100;
    function channel(offset) {
      var k = (offset + h * 12) % 12;
      return 255 * (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
    }
    return [channel(0), channel(8), channel(4)];
  }
  function worldFor(category) {
    var seed = categorySeed(category || "earth");
    var palette = category ? categoryPalette(category) : {
      ocean: hsl(211, 57, 30),
      land: hsl(154, 34, 52),
      cloud: hsl(220, 32, 86),
      warm: hsl(26, 84, 77)
    };
    return {
      seed: seed,
      ocean: palette.ocean,
      land: palette.land,
      cloud: palette.cloud,
      warm: palette.warm,
      cloudCover: 0.56 + hash(8, 3, seed) * 0.09,
      tilt: -0.18 + hash(1, 2, seed) * 0.15
    };
  }
  function categoryPalette(category) {
    // An independent, well-mixed color seed avoids collisions in the old seed % 360 mapping.
    // Geometry keeps its original seed; names still produce the same colors in any list order.
    var key = category.normalize("NFKC").trim().toLowerCase();
    var colorSeed = categorySeed(key + "::palette");
    colorSeed = Math.imul(colorSeed ^ (colorSeed >>> 16), 0x7feb352d);
    colorSeed = Math.imul(colorSeed ^ (colorSeed >>> 15), 0x846ca68b);
    colorSeed = (colorSeed ^ (colorSeed >>> 16)) >>> 0;
    var hue = colorSeed / 4294967296 * 360;
    var landDirection = hash(59, 41, colorSeed) < 0.5 ? -1 : 1;
    return {
      ocean: hsl(hue, 68 + hash(29, 5, colorSeed) * 10, 28 + hash(3, 19, colorSeed) * 8),
      land: hsl(hue + landDirection * (90 + hash(11, 83, colorSeed) * 55), 45 + hash(7, 31, colorSeed) * 20, 49 + hash(13, 2, colorSeed) * 10),
      cloud: hsl(hue + 10, 45 + hash(5, 47, colorSeed) * 10, 80 + hash(17, 9, colorSeed) * 5),
      warm: hsl(hue + 185, 88, 76)
    };
  }

  // Simplified geographic outlines form an Earth, rather than a gas giant.
  // The map is painted in memory; no bitmap, texture, or model is downloaded.
  var continents = [
    [[-168,71],[-151,70],[-141,60],[-130,56],[-126,49],[-123,40],[-117,31],[-111,24],[-104,19],[-97,16],[-91,18],[-87,16],[-83,10],[-78,8],[-82,17],[-87,21],[-81,25],[-80,33],[-74,41],[-65,45],[-60,51],[-67,57],[-78,61],[-84,69],[-98,73],[-109,69],[-128,72],[-145,73]],
    [[-81,12],[-72,11],[-63,9],[-52,4],[-48,-2],[-35,-7],[-40,-18],[-46,-23],[-51,-32],[-60,-40],[-67,-55],[-74,-50],[-74,-39],[-72,-29],[-71,-17],[-79,-5]],
    [[-73,60],[-47,60],[-21,70],[-26,81],[-47,83],[-60,76]],
    [[-17,36],[-5,36],[10,37],[22,32],[32,31],[35,23],[44,12],[51,12],[43,0],[40,-11],[35,-20],[27,-34],[18,-35],[12,-21],[8,-5],[-1,5],[-12,7],[-17,16]],
    [[-10,36],[-9,43],[-1,44],[4,49],[9,54],[8,59],[17,71],[28,71],[31,60],[42,67],[64,70],[89,76],[110,74],[130,69],[151,62],[174,65],[179,57],[160,53],[147,46],[137,36],[124,40],[122,30],[111,21],[106,10],[102,2],[98,7],[95,16],[89,22],[81,8],[75,11],[69,25],[61,25],[55,17],[43,12],[35,30],[28,36],[23,40],[18,40],[17,36],[12,44],[6,43],[1,40]],
    [[113,-22],[122,-17],[131,-12],[137,-13],[142,-11],[146,-20],[153,-28],[148,-38],[137,-35],[130,-31],[116,-35],[113,-28]],
    [[47,-13],[51,-16],[49,-25],[45,-25],[44,-18]],
    [[130,32],[136,34],[142,42],[145,44],[142,36],[136,32]],
    [[-8,50],[-3,51],[1,53],[-3,59],[-6,58]],
    [[-24,64],[-14,65],[-17,67],[-23,66]],
    [[96,5],[105,-4],[116,-8],[122,-9],[120,-4],[110,-1],[108,6],[116,7],[120,1],[119,-5],[112,-7],[102,-5]],
    [[131,-3],[141,-2],[151,-6],[146,-10],[137,-8]],
    [[166,-35],[174,-40],[178,-38],[175,-45],[168,-47],[166,-44],[172,-40]],
    [[-180,-76],[-155,-77],[-130,-73],[-110,-74],[-85,-76],[-65,-66],[-57,-63],[-60,-74],[-30,-78],[0,-71],[30,-70],[60,-68],[90,-68],[120,-68],[150,-72],[180,-76],[180,-90],[-180,-90]]
  ];
  var earthMask;
  function getEarthMask() {
    if (earthMask) return earthMask;
    var map = document.createElement("canvas");
    map.width = TEXTURE_WIDTH; map.height = TEXTURE_HEIGHT;
    var ctx = map.getContext("2d");
    ctx.fillStyle = "white";
    continents.forEach(function (outline) {
      ctx.beginPath();
      outline.forEach(function (point, i) {
        var x = (point[0] + 180) / 360 * TEXTURE_WIDTH;
        var y = (90 - point[1]) / 180 * TEXTURE_HEIGHT;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.closePath(); ctx.fill();
    });
    earthMask = ctx.getImageData(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT).data;
    return earthMask;
  }
  function createTexture(world) {
    var mask = getEarthMask();
    var texture = new Uint8ClampedArray(TEXTURE_WIDTH * TEXTURE_HEIGHT * 3);
    for (var y = 0; y < TEXTURE_HEIGHT; y++) {
      var latitude = Math.PI * (0.5 - y / TEXTURE_HEIGHT);
      var cosLat = Math.cos(latitude), py = Math.sin(latitude);
      for (var x = 0; x < TEXTURE_WIDTH; x++) {
        var longitude = TAU * (x / TEXTURE_WIDTH - 0.5);
        var px = Math.cos(longitude) * cosLat, pz = Math.sin(longitude) * cosLat;
        // Spherical coordinates keep the cloud noise continuous across the date line.
        var broad = noise(px * 4 + pz * 2 + 10, py * 5 + pz * 2 + 10, world.seed);
        var fine = noise(px * 15 + pz * 7 + 20, py * 18 + pz * 6 + 20, world.seed + 5);
        var cloudField = broad * 0.7 + fine * 0.3;
        var cloud = smooth(world.cloudCover - 0.08, world.cloudCover + 0.15, cloudField) * 0.9;
        var warpX = Math.round((broad - 0.5) * 3);
        var warpY = Math.round((fine - 0.5) * 2);
        var mx = (x + warpX + TEXTURE_WIDTH) % TEXTURE_WIDTH;
        var my = clamp(y + warpY, 0, TEXTURE_HEIGHT - 1);
        var land = mask[(my * TEXTURE_WIDTH + mx) * 4 + 3] / 255;
        var ice = smooth(1.1, 1.43, Math.abs(latitude) + broad * 0.11);
        var landShade = 0.75 + broad * 0.45;
        var oceanShade = 0.8 + fine * 0.3;
        var index = (y * TEXTURE_WIDTH + x) * 3;
        for (var channel = 0; channel < 3; channel++) {
          var color = mix(world.ocean[channel] * oceanShade, world.land[channel] * landShade, land);
          color = mix(color, world.cloud[channel], Math.max(cloud, ice));
          texture[index + channel] = color;
        }
      }
    }
    return texture;
  }

  function sprite(rows, colors) {
    var image = document.createElement("canvas");
    image.width = Math.max.apply(null, rows.map(function (row) { return row.length; }));
    image.height = rows.length;
    var ctx = image.getContext("2d");
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        if (colors[row[x]]) { ctx.fillStyle = colors[row[x]]; ctx.fillRect(x, y, 1, 1); }
      }
    });
    return image;
  }
  function spritesFor(world) {
    var colors = { w: "#e6edf7", d: "#38465c", b: "#a6c9ff", r: "#f6a77c", f: "#ffd59d", g: "#a3ef7b", v: "#56ad69", e: "#162d29", c: "#f3b5ad", p: "#b7a1db", s: "#8e9daf", l: "#bdc7d3" };
    colors.b = "rgb(" + world.cloud.map(Math.round).join(",") + ")";
    return {
      rocket: sprite(["....r....","...rwr...","...www...","..wwbww..","..wbbbw..","..wwbww..","..wwwww..",".dwwwwwd.","ddwwwwwdd","dd.ddd.dd","...rfr...","...fff...","....f...."], colors),
      ufo: sprite(["....ggg....","...gwdwg...","..dgggggd..",".bbbbbbbbb.","wwwwwwwwwww",".ddrdddrdd.","...ddddd..."], colors),
      asteroid: sprite(["..sss..",".sllss.","slldsss","sllssds",".ssdds.","..sss.."], colors),
      satellite: sprite([".......w.......","......www......",".bbbb..w..bbbb.",".bdbb.www.bbdb.",".bbbbdwwwdbbbb.",".bdbb.www.bbdb.",".bbbb..w..bbbb.",".......d.......","......rwr......"], colors),
      station: sprite(["..bbbb....w....bbbb..","..bdbb....w....bbdb..","..bbbb...www...bbbb..","..bdbb...wvw...bbdb..","ddddddwwwwwwwwwddddd","..rrrr...www...rrrr..","..rdrd...www...rdrd..","..rrrr....w....rrrr..","..........ww........","...........w........"], colors),
      alien: sprite(["..ggggg..",".ggggggg.",".gwegweg.",".geegeeg.",".cggvggc.","..ggvgg..","..ppppp..",".gpppppg.","...p.p...","..vv.vv.."], colors)
    };
  }

  function createSurfaceRenderer(target) {
    if (!target) return null;
    var context = target.getContext("2d", { alpha: false });
    if (!context) return null;
    var footer = target.closest(".home-footer");
    var world = worldFor("");

    function renderSurface() {
      var bounds = target.parentElement.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      var width = Math.ceil(bounds.width / 2), height = Math.ceil(bounds.height / 2);
      target.width = width; target.height = height;
      var image = context.createImageData(width, height);
      var data = image.data;
      var light = document.documentElement.dataset.theme === "light";
      var paper = light ? [243, 241, 236] : [11, 13, 18];
      var sky = light ? [55, 72, 101] : [20, 33, 55];
      var curveRadius = Math.max(width * 2.3, width * width / (8 * height * 0.22));
      var summit = height * 0.54;
      function horizon(x) {
        var dx = x - width / 2;
        return summit + curveRadius - Math.sqrt(curveRadius * curveRadius - dx * dx);
      }
      for (var x = 0; x < width; x++) {
        var rim = horizon(x + 0.5);
        for (var y = 0; y < height; y++) {
          var threshold = (bayer[(x & 3) + (y & 3) * 4] + 0.5) / 16;
          var grain = hash(x, y, world.seed);
          var color = [0, 0, 0];
          if (y < rim) {
            var dusk = smooth(0.08, 1, y / rim);
            var glow = Math.exp(-Math.pow((y - rim) / 9, 2)) * 0.38;
            var star = dusk > 0.45 && grain > 0.999 ? 80 : 0;
            for (var c = 0; c < 3; c++) {
              color[c] = mix(paper[c], sky[c], dusk * dusk);
              color[c] = mix(color[c], world.cloud[c], glow) + star;
              color[c] += (threshold - 0.5) * 12 * dusk;
            }
          } else {
            var depth = (y - rim) / Math.max(1, height - rim);
            var terrain = noise(x * 0.026, y * 0.065, world.seed) * 0.7 + noise(x * 0.11, y * 0.13, world.seed + 9) * 0.3;
            var ridge = Math.pow(1 - Math.abs(terrain * 2 - 1), 3);
            for (var c = 0; c < 3; c++) {
              var rock = mix(world.ocean[c] * 0.55, world.land[c] * 0.6, terrain);
              color[c] = mix(rock * (0.7 + ridge * 0.4), [8, 15, 24][c], depth * 0.72);
              color[c] += world.cloud[c] * Math.exp(-depth * 9) * 0.14;
              color[c] += (threshold - 0.5) * 16 + (grain - 0.5) * 7;
            }
          }
          // The thin atmospheric edge follows one centered sphere in both themes.
          if (Math.abs(y - rim) < 1.25 && threshold < 0.8) {
            for (var c = 0; c < 3; c++) color[c] = mix(world.cloud[c], world.warm[c], 0.22);
          }
          var offset = (y * width + x) * 4;
          for (var c = 0; c < 3; c++) data[offset + c] = clamp(color[c], 0, 255);
          data[offset + 3] = 255;
        }
      }
      context.putImageData(image, 0, 0);
      target.parentElement.classList.add("is-rendered");
      var mobile = window.innerWidth <= 700;
      var signGround = horizon(width * (mobile ? 0.26 : 0.32)) / height * bounds.height;
      footer.style.setProperty("--sign-ground", signGround + "px");
      footer.style.setProperty("--launch-ground", (horizon(width * (mobile ? 0.74 : 0.68)) / height * bounds.height) + "px");
      footer.style.setProperty("--dome-ground", (summit / height * bounds.height) + "px");
      // Each post meets the curve at its own x-coordinate, rather than at the sign's center.
      var postTop = signGround - footer.querySelector(".billboard-legs").getBoundingClientRect().height;
      footer.querySelectorAll(".billboard-legs > span").forEach(function (post) {
        var postBounds = post.getBoundingClientRect();
        var postX = (postBounds.left + postBounds.width / 2 - bounds.left) / bounds.width * width;
        var groundY = horizon(postX) / height * bounds.height;
        post.style.height = Math.max(0, groundY - postTop + 1.5) + "px";
      });
    }
    if ("ResizeObserver" in window) new ResizeObserver(renderSurface).observe(target.parentElement);
    else window.addEventListener("resize", renderSurface);
    new MutationObserver(renderSurface).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    renderSurface();
    return {
      setCategory: function (category) { world = worldFor(category); renderSurface(); }
    };
  }

  function createRenderer(target) {
    if (!target) return null;
    var context = target.getContext("2d", { alpha: false });
    if (!context) return null;
    var background = document.createElement("canvas");
    var globe = document.createElement("canvas");
    var globeContext = globe.getContext("2d");
    var motionButton = document.querySelector(".motion-toggle");
    var preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    var paused = preference.matches;
    var inView = true;
    var frameRequest = 0;
    var lastTime = 0;
    var lastDraw = -Infinity;
    var elapsed = 0;
    var world = worldFor("");
    var texture = createTexture(world);
    var sprites = spritesFor(world);
    var geometry, frame, orbiters;
    var width = 0, height = 0, cx = 0, cy = 0, radius = 0;
    var mobile = false;

    function resize() {
      var bounds = target.parentElement.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      mobile = window.innerWidth <= 700;
      var cell = mobile ? 2 : 2.4;
      var nextWidth = Math.ceil(bounds.width / cell), nextHeight = Math.ceil(bounds.height / cell);
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth; height = nextHeight;
      target.width = width; target.height = height;
      background.width = width; background.height = height;
      context.imageSmoothingEnabled = false;
      var composition = document.querySelector(".observatory").getBoundingClientRect();
      var contentWidth = composition.width / cell;
      cx = (composition.left - bounds.left) / cell + contentWidth * (mobile ? 0.53 : 0.75);
      cy = (composition.top - bounds.top) / cell + composition.height / cell * (mobile ? 0.245 : 0.445);
      radius = mobile ? contentWidth * 0.355 : Math.min(contentWidth * 0.255, height * 0.385);
      prepareGeometry();
      prepareBackground();
      draw();
    }
    function prepareBackground() {
      var ctx = background.getContext("2d");
      ctx.fillStyle = "#0b0d12"; ctx.fillRect(0, 0, width, height);
      var halo = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.8);
      halo.addColorStop(0, "#14243a55"); halo.addColorStop(1, "#0b0d1200");
      ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height);
      for (var i = 0; i < Math.ceil(width * height / 850); i++) {
        var x = Math.floor(hash(i, 1, 17) * width), y = Math.floor(hash(i, 2, 17) * height);
        ctx.fillStyle = i % 5 ? "#8096b4" : "#dcc8b6";
        ctx.globalAlpha = 0.2 + hash(i, 3, 17) * 0.55;
        ctx.fillRect(x, y, i % 17 ? 1 : 2, 1);
      }
      ctx.globalAlpha = 1;
    }
    function prepareGeometry() {
      if (!radius) return;
      var extent = Math.ceil(radius * 1.065);
      var side = extent * 2 + 1;
      globe.width = side; globe.height = side;
      frame = globeContext.createImageData(side, side);
      var offsets = [], u = [], rows = [], shades = [], warmth = [], dithers = [];
      var cos = Math.cos(world.tilt), sin = Math.sin(world.tilt);
      for (var y = 0; y < side; y++) {
        for (var x = 0; x < side; x++) {
          var dx = (x - extent) / radius, dy = (y - extent) / radius;
          var distance = Math.sqrt(dx * dx + dy * dy);
          var threshold = (bayer[(x & 3) + (y & 3) * 4] + 0.5) / 16;
          var offset = (y * side + x) * 4;
          if (distance <= 1) {
            var z = Math.sqrt(1 - distance * distance);
            var light = clamp(dx * 0.56 - dy * 0.56 + z * 0.44, 0, 1);
            var nx = dx * cos + dy * sin, ny = -dx * sin + dy * cos;
            var longitude = Math.atan2(nx, z);
            var latitude = Math.asin(clamp(ny, -1, 1));
            var shade = 0.08 + Math.pow(light, 0.85) * 0.98;
            var coverage = clamp(light * 1.7 + z * 0.28 + 0.04, 0, 1);
            if (threshold > coverage) shade *= 0.28;
            offsets.push(offset);
            u.push((longitude / TAU + 0.5) * TEXTURE_WIDTH);
            rows.push(clamp(Math.floor((0.5 - latitude / Math.PI) * TEXTURE_HEIGHT), 0, TEXTURE_HEIGHT - 1) * TEXTURE_WIDTH * 3);
            shades.push(shade);
            warmth.push(Math.pow(1 - z, 7) * light * 0.58 + Math.pow(clamp(-dy * 0.8 + dx * 0.55, 0, 1), 4) * light * 0.13);
            dithers.push((threshold - 0.5) * 25 + (hash(x, y, 17) - 0.5) * 10);
            frame.data[offset + 3] = 255;
          } else if (distance < 1.055) {
            var atmosphere = Math.pow(1 - (distance - 1) / 0.055, 2) * clamp(dx * 0.56 - dy * 0.56 + 0.12, 0, 1);
            if (threshold < atmosphere * 0.85) {
              for (var c = 0; c < 3; c++) frame.data[offset + c] = mix(world.cloud[c], world.warm[c], clamp(-dy, 0, 1)) * atmosphere;
              frame.data[offset + 3] = 255;
            }
          }
        }
      }
      geometry = { extent: extent, offsets: new Uint32Array(offsets), u: new Float32Array(u), rows: new Uint32Array(rows), shades: new Float32Array(shades), warmth: new Float32Array(warmth), dithers: new Float32Array(dithers) };
      var traffic = [
        { type: "rocket", phase: 1.3, distance: 1.3, speed: 0.18 },
        { type: "ufo", phase: 3.8, distance: 1.45, speed: 0.1 },
        { type: "asteroid", phase: 0.15, distance: 1.55, speed: 0.04 },
        { type: "asteroid", phase: 4.8, distance: 1.22, speed: 0.075 },
        { type: "satellite", phase: 1.9, distance: 1.15, speed: 0.14 },
        { type: "station", phase: 0.8, distance: 1.2, speed: 0.055 },
        { type: "alien", phase: 2.65, distance: 1.32, speed: 0.085 }
      ];
      orbiters = traffic.map(function (object, i) {
        return {
          type: object.type,
          phase: object.phase + hash(i, 10, world.seed) * 0.65,
          speed: object.speed * (0.8 + hash(i, 11, world.seed) * 0.5) * (i % 2 ? -1 : 1),
          distance: object.distance + hash(i, 12, world.seed) * 0.1,
          tilt: -1.2 + hash(i, 13, world.seed) * 2.4,
          flattening: 0.28 + hash(i, 14, world.seed) * 0.5
        };
      });
    }
    function drawOrbiter(object, front) {
      var angle = object.phase + elapsed * object.speed;
      var depth = Math.sin(angle);
      if ((depth >= 0) !== front) return;
      var orbitRadius = radius * object.distance;
      var x = Math.cos(angle) * orbitRadius, y = depth * orbitRadius * object.flattening;
      var cos = Math.cos(object.tilt), sin = Math.sin(object.tilt);
      var px = cx + x * cos - y * sin, py = cy + x * sin + y * cos;
      var velocityX = -Math.sin(angle) * cos - Math.cos(angle) * object.flattening * sin;
      var velocityY = -Math.sin(angle) * sin + Math.cos(angle) * object.flattening * cos;
      var image = sprites[object.type];
      context.save();
      var bob = object.type === "alien" ? Math.sin(elapsed * 1.5 + object.phase) * 1.5 : 0;
      context.translate(Math.round(px), Math.round(py + bob));
      var rotation = object.type === "rocket" ? Math.atan2(velocityY * object.speed, velocityX * object.speed) + Math.PI / 2 : 0;
      if (object.type === "asteroid") rotation = elapsed * 0.15;
      if (object.type === "satellite") rotation = object.phase * 0.2 + elapsed * 0.05;
      if (object.type === "station") rotation = -0.15;
      if (object.type === "alien") rotation = Math.sin(elapsed * 0.7) * 0.15;
      context.rotate(rotation);
      context.globalAlpha = front ? 1 : 0.7;
      context.drawImage(image, -Math.floor(image.width / 2), -Math.floor(image.height / 2));
      context.restore();
    }
    function draw() {
      if (!geometry) return;
      // A full turn takes about 90 seconds. The expensive terrain is cached in the texture.
      var rotation = elapsed * 0.07 * TEXTURE_WIDTH / TAU;
      var data = frame.data;
      for (var i = 0; i < geometry.offsets.length; i++) {
        var tx = (Math.floor(geometry.u[i] + rotation) + TEXTURE_WIDTH) & (TEXTURE_WIDTH - 1);
        var source = geometry.rows[i] + tx * 3;
        var offset = geometry.offsets[i];
        var shade = geometry.shades[i], warm = geometry.warmth[i], dither = geometry.dithers[i];
        for (var c = 0; c < 3; c++) {
          var value = texture[source + c] * shade + world.warm[c] * warm + dither * Math.min(shade * 2, 1);
          data[offset + c] = clamp(Math.round(value / 12) * 12, c === 2 ? 18 : 11, 255);
        }
      }
      globeContext.putImageData(frame, 0, 0);
      context.drawImage(background, 0, 0);
      orbiters.forEach(function (object) { drawOrbiter(object, false); });
      context.drawImage(globe, Math.round(cx - geometry.extent), Math.round(cy - geometry.extent));
      orbiters.forEach(function (object) { drawOrbiter(object, true); });
      target.parentElement.classList.add("is-rendered");
    }
    function isRunning() { return !paused && inView && !document.hidden; }
    function tick(time) {
      frameRequest = 0;
      if (!isRunning()) { lastTime = 0; return; }
      if (lastTime) elapsed += Math.min(time - lastTime, 100) / 1000;
      lastTime = time;
      if (time - lastDraw >= (mobile ? 1000 / 18 : 1000 / 24)) { draw(); lastDraw = time; }
      frameRequest = requestAnimationFrame(tick);
    }
    function schedule() {
      cancelAnimationFrame(frameRequest);
      frameRequest = 0; lastTime = 0;
      if (isRunning()) frameRequest = requestAnimationFrame(tick);
    }
    function updateMotionButton() {
      document.documentElement.dataset.motion = paused ? "paused" : "running";
      motionButton.setAttribute("aria-pressed", String(paused));
      motionButton.setAttribute("aria-label", paused ? "Resume animation" : "Pause animation");
      motionButton.querySelector(".motion-symbol").textContent = paused ? "▷" : "Ⅱ";
    }
    motionButton.hidden = false;
    updateMotionButton();
    motionButton.addEventListener("click", function () { paused = !paused; updateMotionButton(); schedule(); });
    function preferenceChanged(event) { paused = event.matches; updateMotionButton(); schedule(); }
    if (preference.addEventListener) preference.addEventListener("change", preferenceChanged);
    else preference.addListener(preferenceChanged);
    document.addEventListener("visibilitychange", schedule);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (observations) { inView = observations[0].isIntersecting; schedule(); }).observe(target);
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(target.parentElement);
    else window.addEventListener("resize", resize);
    resize();
    schedule();
    return {
      setCategory: function (category) {
        world = worldFor(category);
        texture = createTexture(world);
        sprites = spritesFor(world);
        prepareGeometry();
        draw();
      }
    };
  }
  surfaceRenderer = createSurfaceRenderer(document.getElementById("horizon-canvas"));
  renderer = createRenderer(canvas);
}());
