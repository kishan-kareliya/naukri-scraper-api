import express, { Request, Response } from "express";
import startBot from "./scraper/scraper";

const app = express();
const port = 3000;

app.get("/jobs", async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();

  const beforeMemoryUsage = process.memoryUsage();
  const beforeCPUUsage = process.cpuUsage();

  const jobRole = req.query.role as string;
  const jobLocation = req.query.location as string;
  const limit = Number(req.query.limit);

  if (!jobRole || !jobLocation || isNaN(limit)) {
    return res.status(400).json({ error: "Missing role or location or limit" });
  }

  try {
    console.log(`Finding jobs for ${jobRole} in location ${jobLocation}`);
    const jobs = await startBot(jobRole, jobLocation, limit);

    // Track memory usage after request
    const afterMemoryUsage = process.memoryUsage();
    const afterCPUUsage = process.cpuUsage();

    const elapsedTime = Date.now() - startTime;

    const memoryUsage = {
      rss: afterMemoryUsage.rss - beforeMemoryUsage.rss,
      heapTotal: afterMemoryUsage.heapTotal - beforeMemoryUsage.heapTotal,
      heapUsed: afterMemoryUsage.heapUsed - beforeMemoryUsage.heapUsed,
    };

    const cpuUsage = {
      user: (afterCPUUsage.user - beforeCPUUsage.user) / 1000,
      system: (afterCPUUsage.system - beforeCPUUsage.system) / 1000,
    };

    console.log("Memory Used: \n");
    console.log(memoryUsage);
    console.log("Cpu Usage\n");
    console.log(cpuUsage);

    return res.json({
      jobs,
      memoryUsage,
      cpuUsage,
      timeTakenMs: elapsedTime,
    });
  } catch (error) {
    console.error("Error scraping jobs:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
