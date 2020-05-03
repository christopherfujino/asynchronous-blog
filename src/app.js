import * as commonmark from "commonmark";

class Host {
  constructor(url) {
    const hashIndex = url.lastIndexOf("#");
    this.url = hashIndex === -1
      ? url
      // strip off trailing hash
      : url.substring(0, hashIndex);
  }
}

const host = new Host(window.location.href);

/** Given two strings, return two substrings after common prefix */
function diffStrings(str1, str2) {
  let i = 0, arr1 = [], arr2 = [], inPrefix = true;
  while(str1[i] !== undefined || str2[i] !== undefined) {
    if (inPrefix) {
      if (str1[i] === str2[i]) {
        i++;
        continue;
      }
      inPrefix = false;
    }
    arr1.push(str1[i]); // .join() will strip out `undefined`s at the end
    arr2.push(str2[i]);
    i++;
  }
  return [arr1.join(""), arr2.join("")];
}

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
  render(data, parent, middleware) {
    const parsed = this.reader.parse(data); // parsed is a 'Node' tree

    // TODO implement if needed
    //if (astMiddleware) {
    //  const walker = parsed.walker();
    //  let event;

    //  while ((event = walker.next())) {
    //    astMiddleware(event);
    //  }
    //}
    const result = this.writer.render(parsed); // result is a String

    const div = document.createElement("div");
    div.innerHTML = result;

    if (middleware) {
      middleware(div);
    }
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
  constructor(url, renderer, fetcher) {
    this.renderer = renderer;
    this.fetcher = fetcher;
    const regexes = [
      // e.g. https://raw.githubusercontent.com/org/repo/master/README.md
      /^(?:https?:\/\/)raw\.githubusercontent\.com\/([\w-_.]+)\/([\w-_.]+)\/([\w-_.]+)\/(.*\.md)$/i,
      // e.g. https://www.github.com/org/repo/blob/master/README.md
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-_.]+)\/([\w-_.]+)\/blob\/([\w-_.]+)\/(.*\.md)$/i,
    ];
    let match;
    for (const regex of regexes) {
      match = regex.exec(url);
      if (match) {
        break;
      }
    }
    this.org = match[1];
    this.repo = match[2];
    this.branch = match[3];
    this.entity = match[4];

    if (!this.org || !this.repo || !this.branch || !this.entity) {
      throw new Error(`${url} does not look like a valid github link!`);
    }
  }

  isValid() {
    return this.org && this.repo && this.branch && this.entity && true || false;
  }

  url(entity) {
    if (!this.isValid()) {
      throw new Error("Invalid state!");
    }
    if (!entity) {
      throw new Error("You didn't pass an arg to url!");
    }
    return `https://raw.githubusercontent.com/${this.org}/${this.repo}/${this.branch}/${entity}`;
  }

  async render(parent, entity) {
    if (!entity) {
      entity = this.entity;
    }
    const text = await this.fetcher(this.url(entity));
    this.renderer.render(
      text,
      parent,
      (div) => { // DOM middleware
        const links = div.querySelectorAll("a");
        for (const link of links) {
          link.dataset.jsHref = diffStrings(
            window.location.href,
            link.href,
          )[1];
          const captured = diffStrings(
            host.url,
            link.href,
          )[1];
          if (captured.indexOf(".") > -1) {
            continue; // Probably external link
          }
          if (captured[0] === "#") {
            link.href = captured;
          } else {
            link.href = "#";
            link.addEventListener(
              "click",
              () => this.render(parent, captured),
            );
          }
        }
        const headers = div.querySelectorAll("h1, h2, h3, h4, h5, h6");
        for (const header of headers) {
          header.id = header.innerText.toLowerCase();
        }
      },
    );
  }
}

async function main() {
  let blog;
  const renderer = new Renderer();
  const container = document.createElement("div");
  container.id = "app-container";
  const header = `
  <div>
    <label>
      <div>
        Enter a URL to a markdown file hosted on
        <a href="https://github.com" target="_blank">
          GitHub
        </a>
      </div>
      <input
        id="url-input"
        type="text"
        size=85
        value="https://github.com/christopherfujino/blog/blob/master/README.md">
    </label>
    <button id="fetch-button">go!</button>
  </div>
  `;

  renderer.render(header, document.body);
  document.body.append(container);
  document.getElementById("fetch-button").addEventListener(
    "click",
    async function () {
      const url = document.getElementById("url-input").value;
      blog = new Blog(url, renderer, fetcher);
      await blog.render(container);
    },
  );
}

main();
