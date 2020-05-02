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
  div.innerText = data;
  return div;
}

async function main() {
  const url =
    "https://raw.githubusercontent.com/christopherfujino/dotfiles/master/.vimrc";
  const raw = await fetcher(url);

  console.log(raw);
  const div = render(raw);
  document.body.append(div);
}

main();
