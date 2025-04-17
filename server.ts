import express, { Request, Response } from "express";
import startBot from "./scraper/scraper";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);
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
    const jobs = await startBot(role, location, limit);

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

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running at http://localhost:${port}`);
});
