import * as commonmark from "commonmark";

/** Fetch endpoint and return response text */
async function fetcher(endpoint, init = {}) {
  try {
    const response = await window.fetch(endpoint, init);
    const text = await response.text();
    if (!response.ok) {
      console.error(`Fetch failed with code ${response.status}!`);
      console.error(text);
      return response;
    }
    return text;
  } catch(err) {
    console.error("Fetch failed!");
    console.log(err);
  }
}

function render(data) {
  const div = document.createElement("div");
  div.innerHTML = data;
  return div;
}

async function main() {
  const url =
    "https://raw.githubusercontent.com/christopherfujino/dotfiles/master/README.md";
  const raw = await fetcher(url);

  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();
  const parsed = reader.parse(raw); // parsed is a 'Node' tree
  // transform parsed if you like...
  const result = writer.render(parsed); // result is a String
  console.log(result);
  const div = render(result);
  document.body.append(div);
}

main();
