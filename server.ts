import express, { Request, Response } from "express";
import startBot from "./scraper/scraper";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get("/jobs", async (req: Request, res: Response): Promise<any> => {
  const jobRole = req.query.role as string;
  const jobLocation = req.query.location as string;
  const limit = Number(req.query.limit);

  if (!jobRole || !jobLocation || isNaN(limit)) {
    return res.status(400).json({ error: "Missing role or location or limit" });
  }

  try {
    console.log(`Finding jobs for ${jobRole} in location ${jobLocation}`);
    const jobs = await startBot(jobRole, jobLocation, limit);
    return res.json(jobs);
  } catch (error) {
    console.error("Error scraping jobs:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
