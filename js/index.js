
/* sort by category */

// sortBy category
var categories = document.getElementsByClassName("list-category");
var i;

for (i = 0; i < categories.length; i++) {
  categories[i].addEventListener("click", function() {
    var content = document.getElementById("sort-category");
    content.classList.remove("hidden");
    var sortBy = document.getElementById("sort-by");
    sortBy.innerHTML = "[x] " + this.textContent;
    hideAllExcept(this.textContent);
  });
}

function hideAllExcept(category) {
  var j;
  for (j = 0; j < categories.length; j++) {
    if (categories[j].textContent != category) {
      categories[j].parentNode.classList.add("hidden");
    }
  }
}

// Remove sortBy
var sortBy = document.getElementById("sort-by");

sortBy.addEventListener("click", function() {
  var content = document.getElementById("sort-category");
  content.classList.add("hidden");
  sortBy.innerHTML = null;
  showAllPosts();
});

function showAllPosts() {
  var j;
  for (j = 0; j < categories.length; j++) {
    categories[j].parentNode.classList.remove("hidden");
  }
}


/* expand & collapse about section */

var about = document.getElementsByClassName("about");

about[0].addEventListener("click", function() {
  var content = this.nextElementSibling;
  if (content.style.maxHeight){
    content.style.maxHeight = null;
    content.style.margin = null; 
  } else {
    content.style.maxHeight = content.scrollHeight + "px";
    content.style.margin = "-1em 0"; 
  }
});