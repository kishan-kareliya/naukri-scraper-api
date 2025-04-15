import puppeteer from "puppeteer-extra";
import { Browser, Page } from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import UserAgent from "user-agents";
import parseHtmlToText from "./htmlParser";

puppeteer.use(StealthPlugin());

interface Job {
  title: string | null;
  link: string | null;
  company: string | null;
  experience: string | null;
  salary: string | null;
  location: string | null;
  tags: string[];
  postedDate: string | null;
  description?: string;
}

async function extractJobDescription(
  browser: Browser,
  userAgent: UserAgent,
  url: string
): Promise<string> {
  const page = await browser.newPage();
  await page.setUserAgent(userAgent.toString());

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

    await delay(1000 + Math.random() * 3000);
    await simulateHumanBehavior(page);

    const rawHtml = await page.$eval(
      ".styles_JDC__dang-inner-html__h0K4t",
      (el) => el.innerHTML
    );
    const descriptionText = parseHtmlToText(rawHtml);

    await page.close();
    return descriptionText;
  } catch (error) {
    console.warn(`⚠️ Failed to extract description for: ${url}`);
    await page.close();
    return "Description not available";
  }
}

async function startBot(
  jobRole: string,
  jobLocation: string,
  limit: number
): Promise<Job[]> {
  const userAgent = new UserAgent({ deviceCategory: "desktop" });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    defaultViewport: {
      width: 1280 + Math.floor(Math.random() * 100),
      height: 800 + Math.floor(Math.random() * 100),
    },
  });

  const page = await browser.newPage();
  await page.setUserAgent(userAgent.toString());

  console.log("User-Agent:", userAgent.toString());

  await page.goto("https://www.naukri.com", {
    waitUntil: "networkidle2",
    timeout: 0,
  });

  await delay(2000 + Math.random() * 1000);

  await page.click(".keywordSugg .suggestor-input");
  await page.type(".keywordSugg .suggestor-input", jobRole, {
    delay: randomDelay(),
  });

  await page.click(".locationSugg .suggestor-input");
  await page.type(".locationSugg .suggestor-input", jobLocation, {
    delay: randomDelay(),
  });

  await delay(2000);
  await page.waitForSelector(".qsbSubmit", { visible: true });

  await page.evaluate(() => {
    const btn = document.querySelector(".qsbSubmit");
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      btn.dispatchEvent(event);
    }
  });

  await delay(4000);
  await simulateHumanBehavior(page);
  await delay(4000);

  const jobCardHandles = await page.$$(".srp-jobtuple-wrapper");
  const jobs: Job[] = [];

  for (let i = 0; i < Math.min(limit, jobCardHandles.length); i++) {
    const card = jobCardHandles[i];

    const job: Job = await card.evaluate((el) => {
      const getText = (selector: string): string | null => {
        const element = el.querySelector(selector) as HTMLElement | null;
        return element?.innerText?.trim() || null;
      };

      const getHref = (selector: string): string | null => {
        const element = el.querySelector(selector) as HTMLAnchorElement | null;
        return element?.href || null;
      };

      const getTags = (): string[] => {
        return Array.from(el.querySelectorAll(".tags-gt li")).map((tag) =>
          (tag as HTMLElement).innerText.trim()
        );
      };

      return {
        title: getText("h2 > a.title"),
        link: getHref("h2 > a.title"),
        company: getText(".comp-name"),
        experience: getText(".expwdth"),
        salary: getText(".sal-wrap span[title]"),
        location: getText(".locWdth"),
        tags: getTags(),
        postedDate: getText(".job-post-day"),
      };
    });

    console.log(`✅ Extracted job ${i + 1}: ${job.title}`);
    await delay(3000 + Math.random() * 3000);

    jobs.push(job);
    job.description = await extractJobDescription(
      browser,
      userAgent,
      job.link || ""
    );

    await delay(1000 + Math.random() * 1000);
  }

  await browser.close();

  return jobs;
}

// Utility delay function
function delay(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Delay between keystrokes
function randomDelay(): number {
  return Math.floor(Math.random() * (300 - 150 + 1)) + 150;
}

// Simulate human scrolling and mouse movements
async function simulateHumanBehavior(page: Page): Promise<void> {
  const mouse = page.mouse;
  const width = await page.evaluate(() => window.innerWidth);
  const height = await page.evaluate(() => window.innerHeight);

  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    await mouse.move(x, y, { steps: Math.floor(Math.random() * 20 + 10) });

    await mouse.move(
      x + Math.floor(Math.random() * 5),
      y + Math.floor(Math.random() * 5)
    );
    await delay(randomDelay());
  }

  for (let i = 0; i < 8; i++) {
    const scrollY = Math.floor(Math.random() * 300 + 100);
    const direction = Math.random() > 0.5 ? 1 : -1;
    await page.evaluate((y) => window.scrollBy(0, y), scrollY * direction);
    await delay(Math.random() * 1200 + 300);
  }

  for (let i = 0; i < 3; i++) {
    const scrollX = Math.floor(Math.random() * 200 + 50);
    const direction = Math.random() > 0.5 ? 1 : -1;
    await page.evaluate((x) => window.scrollBy(x, 0), scrollX * direction);
    await delay(Math.random() * 800 + 300);
  }

  await delay(Math.random() * 2000 + 1000);
}

export default startBot;
