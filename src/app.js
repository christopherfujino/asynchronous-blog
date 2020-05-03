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

class Renderer {
  constructor() {
    this.reader = new commonmark.Parser();
    this.writer = new commonmark.HtmlRenderer();
  }
  render(data, parent) {
    const parsed = this.reader.parse(data); // parsed is a 'Node' tree
    const result = this.writer.render(parsed); // result is a String

    const div = document.createElement("div");
    div.innerHTML = result;
    // wipe out current contents
    parent.innerHTML = "";
    parent.append(div);
  };
}

/** Transform a regular github link to its raw equivalent.
 *
 * For example, https://www.github.com/org/repo/README.md should become
 * https://raw.githubusercontent.com/org/repo/master/README.md. */
function getRawUrl(url) {
  // Check if the format is already correct
  const rawRegex = /^(?:https?:\/\/)raw\.githubusercontent\.com\/[\w-_.]+\/[\w-_.]+\/[\w-_.]+\/.*\.md$/i;
  if (rawRegex.exec(url)) {
    return url;
  }
  let org, repo, branch, entity;
  // e.g. https://www.github.com/org/repo/blob/master/README.md
  const longRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-_.]+)\/([\w-_.]+)\/blob\/([\w-_.]+)\/(.*\.md)$/i;
  let match = longRegex.exec(url);
  if (match) {
    org = match[1];
    repo = match[2];
    branch = match[3];
    entity = match[4];
  } else {
    // e.g. https://www.github.com/org/repo/README.md
    const shortRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-_.]+)\/([\w-_.]+)\/(.*\.md)$/i;
    match = shortRegex.exec(url);
    if (match) {
      org = match[1];
      repo = match[2];
      branch = "master";
      entity = match[4];
    }
  }

  if (!org || !repo || !branch || !entity) {
    throw new Error(`${url} does not look like a valid github link!`);
  }

  return `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${entity}`;
}

async function main() {
  const renderer = new Renderer();
  const container = document.createElement("div");
  container.id = "app-container";
  const header = `
  <div>
    <input id="url-input" type="text" size=100>
    <button id="fetch-button">go!</button>
  </div>
  `;

  renderer.render(header, document.body);
  document.body.append(container);
  document.getElementById("fetch-button").addEventListener(
    "click",
    async function () {
      const url = document.getElementById("url-input").value;
      const rawUrl = getRawUrl(url);
      renderer.render(await fetcher(rawUrl), container);
    },
  );
}

main();
