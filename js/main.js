
/* Update date & time */

function refreshTime() {
  var timeString = new Date().toLocaleTimeString();
  document.getElementById("time").textContent = timeString;
}
refreshTime();
setInterval(refreshTime, 1000);

function refreshDate() {
  var day = twoDigits(new Date().getDate());
  var month = twoDigits(new Date().getMonth()+1);
  var year = new Date().getFullYear();
  document.getElementById("date").textContent = day + "/" + month + "/" + year;
}

function twoDigits(num) {
  if (num < 10) {
    return "0" + num;
  }
  return num;
}

refreshDate();
setInterval(refreshDate, 60000);


/* dark & light mode */

const theme = localStorage.getItem('theme');

const userPrefers = getComputedStyle(document.documentElement).getPropertyValue('content');	

if (userPrefers === "dark" || theme === "dark") {
	document.documentElement.setAttribute('data-theme', 'dark');
	window.localStorage.setItem('theme', 'dark');
	document.getElementById("theme-toggle").innerHTML = "Light Mode";
} else {
	document.documentElement.setAttribute('data-theme', 'light');
	window.localStorage.setItem('theme', 'light');
	document.getElementById("theme-toggle").innerHTML = "Dark Mode";
}


function modeSwitcher() {
	let currentMode = document.documentElement.getAttribute('data-theme');
	if (currentMode === "dark") {
		document.documentElement.setAttribute('data-theme', 'light');
		window.localStorage.setItem('theme', 'light');
		document.getElementById("theme-toggle").innerHTML = "Dark Mode";
	} else {
		document.documentElement.setAttribute('data-theme', 'dark');
		window.localStorage.setItem('theme', 'dark');
		document.getElementById("theme-toggle").innerHTML = "Light Mode";
	}
}