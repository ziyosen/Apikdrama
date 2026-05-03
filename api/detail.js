import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "url query required",
        example:
          "/api/detail?url=https://drama-id.com/nonton-when-our-kids-fall-in-love-season-2/",
      });
    }

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(data);

    // 🔥 BASIC INFO
    const title = $(".single-title").text().trim();
    const episodeTitle = $(".single_h2").text().trim();
    const thumbnail = $(".thumbnail_single img").attr("src");
    const synopsis = $(".synopsis p").text().trim();
    const update = $(".date").first().text().trim();

    // 🔥 INFO LIST
    const info = {};
    $(".info li").each((_, el) => {
      const key = $(el).find("strong").text().replace(":", "").trim();
      const value = $(el)
        .text()
        .replace($(el).find("strong").text(), "")
        .trim();
      info[key] = value;
    });

    // 🔥 EPISODE LIST
    const episodes = [];
    $(".episode-list li").each((_, el) => {
      const title = $(el).find(".title_episode_2").text().trim();
      const link = $(el).find("a").attr("href");

      if (title && link) {
        episodes.push({
          title,
          link: url.split("?")[0] + link,
        });
      }
    });

    // 🔥 DOWNLOAD LINK
    const downloads = [];
    $(".download a").each((_, el) => {
      const text = $(el).text().trim();
      const link = $(el).attr("href");

      downloads.push({ text, link });
    });

    res.status(200).json({
      title,
      episodeTitle,
      thumbnail,
      synopsis,
      update,
      info,
      episodes,
      downloads,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
}
