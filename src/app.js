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
  /** Render a string of MarkDown content to an HTML string */
  render(data, parent) {
    const parsed = this.reader.parse(data); // parsed is a 'Node' tree
    const result = this.writer.render(parsed); // result is a String

    const div = document.createElement("div");
    div.innerHTML = result;
    // wipe out current contents
    parent.innerHTML = "";
    parent.append(div);
  }
}

/** Wrapper around the remote repo for a Blog */
class Blog {
  /** Transform a regular github link to its raw equivalent.
   *
   * For example, https://www.github.com/org/repo/README.md should become
   * https://raw.githubusercontent.com/org/repo/master/README.md. */
  constructor(url, renderer) {
    this.renderer = renderer;
    // Check if the format is already correct
    const rawRegex = /^(?:https?:\/\/)raw\.githubusercontent\.com\/([\w-_.]+)\/([\w-_.]+)\/([\w-_.]+)\/(.*\.md)$/i;
    let match = rawRegex.exec(url);
    if (match) {
      this.org = match[1];
      this.repo = match[2];
      this.branch = match[3];
      this.entity = match[4];
      return;
    }
    // e.g. https://www.github.com/org/repo/blob/master/README.md
    const longRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-_.]+)\/([\w-_.]+)\/blob\/([\w-_.]+)\/(.*\.md)$/i;
    match = longRegex.exec(url);
    if (match) {
      this.org = match[1];
      this.repo = match[2];
      this.branch = match[3];
      this.entity = match[4];
      return;
    }
    // e.g. https://www.github.com/org/repo/README.md
    const shortRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-_.]+)\/([\w-_.]+)\/(.*\.md)$/i;
    match = shortRegex.exec(url);
    if (match) {
      this.org = match[1];
      this.repo = match[2];
      this.branch = "master";
      this.entity = match[4];
    }

    if (!this.org || !this.repo || !this.branch || !this.entity) {
      throw new Error(`${url} does not look like a valid github link!`);
    }
    console.log(`Successful parse of ${url}`);
    console.log("org", this.org);
    console.log("repo", this.repo);
    console.log("branch", this.branch);
    console.log("entity", this.entity);
  }

  isValid() {
    return this.org && this.repo && this.branch && this.entity && true || false;
  }

  get url() {
    //if (!this.isValid()) {
    //  throw new Error("Invalid state!");
    //}
    return `https://raw.githubusercontent.com/${this.org}/${this.repo}/${this.branch}/${this.entity}`;
  }
}

async function main() {
  let blog;
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
      blog = new Blog(url);
      renderer.render(await fetcher(blog.url), container);
    },
  );
}

main();
