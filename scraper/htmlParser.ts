import { JSDOM } from "jsdom";

function parseHtmlToText(htmlString: string): string {
  const dom = new JSDOM(htmlString);
  const document = dom.window.document;

  const tagsToRemove = [
    "script",
    "style",
    "svg",
    "noscript",
    "iframe",
    "canvas",
  ];

  tagsToRemove.forEach((tag) => {
    const elements = document.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  });

  const text = document.body.textContent || "";

  return text
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export default parseHtmlToText;
