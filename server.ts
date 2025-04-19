import express, { Request, Response } from "express";
import startBot from "./scraper/scraper";
import dotenv from "dotenv";
import axios from "axios";
import pidusage from "pidusage";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.post("/jobs", async (req: Request, res: Response): Promise<any> => {
  const { role, location, limit, webhookUrl } = req.body;

  if (!role || !location || !limit || !webhookUrl) {
    return res.status(400).json({
      error: "Missing required fields: role, location, limit, webhookUrl",
    });
  }

  console.log(`Finding job for ${role} in ${location}, limit ${limit}`);
  res.json({
    status: "Job started",
    message: "will send data to webhookUrl once ready",
  });

  try {
    let peakCPU = 0;
    let peakMemory = 0;
    let usageInterval = null;

    usageInterval = setInterval(async () => {
      const stats = await pidusage(process.pid);
      if (stats.cpu > peakCPU) peakCPU = stats.cpu;
      if (stats.memory > peakMemory) peakMemory = stats.memory;
    }, 1000);

    const jobs = await startBot(role, location, limit);

    clearInterval(usageInterval);
    const memoryInMB = (peakMemory / 1024 / 1024).toFixed(2);
    console.log(`\n🔧 Peak CPU Usage: ${peakCPU.toFixed(1)}%`);
    console.log(`📊 Peak Memory Usage: ${memoryInMB} MB`);

    await axios.post(webhookUrl, {
      status: "success",
      data: jobs,
    });

    console.log(`✅ Webhook sent successfully`);
  } catch (error) {
    console.error("❌ Error scraping jobs or sending webhook:", error);
    try {
      await axios.post(webhookUrl, {
        status: "failed",
        error: "Scraping failed",
      });
    } catch (webhookErr) {
      console.error("❌ Failed to notify webhook endpoint:", webhookErr);
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
