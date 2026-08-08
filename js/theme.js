(function () {
  var root = document.documentElement;
  var toggles = document.querySelectorAll(".theme-toggle");

  function applyTheme(theme) {
    var isLight = theme === "light";
    var themeColor = document.querySelector('meta[name="theme-color"]');
    root.dataset.theme = isLight ? "light" : "dark";

    if (themeColor) {
      themeColor.setAttribute("content", isLight ? "#f2eee7" : "#06070a");
    }

    toggles.forEach(function (toggle) {
      toggle.setAttribute("aria-pressed", String(isLight));
      toggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    });
  }

  applyTheme(root.dataset.theme === "light" ? "light" : "dark");

  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var nextTheme = root.dataset.theme === "light" ? "dark" : "light";
      applyTheme(nextTheme);

      try {
        localStorage.setItem("pn-theme", nextTheme);
      } catch (error) {
        // The selected theme still applies for this page view.
      }
    });
  });
}());
