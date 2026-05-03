// /api/list.js

import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { path = "/status-drama/ongoing/" } = req.query;
    const baseUrl = "https://drama-id.com";
    const url = baseUrl + path;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(data);

    const results = [];

    // 🔥 ini udah disesuaikan sama HTML yang kamu kirim
    $(".style_post_1 article").each((i, el) => {
      const title = $(el).find(".title_post a").text().trim();
      const link = $(el).find(".title_post a").attr("href");
      const thumbnail = $(el).find(".thumbnail img").attr("src");
      const update = $(el).find(".date").text().trim();

      let episode = "";
      $(el)
        .find(".info li")
        .each((_, li) => {
          if ($(li).text().includes("Episode")) {
            episode = $(li).text().replace("Episode:", "").trim();
          }
        });

      if (title && link) {
        results.push({
          title,
          link,
          thumbnail,
          episode,
          update,
        });
      }
    });

    res.status(200).json({
      total: results.length,
      data: results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
