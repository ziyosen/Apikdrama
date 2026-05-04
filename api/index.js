const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // 1. TEMBAK LANGSUNG KE KATEGORI KOREA
    const targetUrl = 'https://drama-id.com/negara/korea-selatan/'; 
    const domain = 'https://drama-id.com';

    const { data } = await axios.get(targetUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(data);
    const movies = [];

    // 2. SELECTOR BARU (Disesuaikan dengan struktur umum web drama)
    // Coba ganti '.media-block' dengan '.ml-item' atau 'article' jika masih kosong
    $('.ml-item, .media-block, article').each((i, el) => {
      if (i < 8) { 
        const title = $(el).find('h2, .title, .mli-info').text().trim();
        let detailUrl = $(el).find('a').attr('href');
        const image = $(el).find('img').attr('data-original') || $(el).find('img').attr('src');

        if (detailUrl && title) {
          if (!detailUrl.startsWith('http')) detailUrl = domain + detailUrl;
          movies.push({ title, image, detail_url: detailUrl, streaming_url: null });
        }
      }
    });

    // 3. AMBIL LINK VIDEO (DEEP SCRAPE)
    for (let i = 0; i < movies.length; i++) {
      try {
        const detailRes = await axios.get(movies[i].detail_url, { timeout: 3000 });
        const $detail = cheerio.load(detailRes.data);
        
        // Mencari iframe di dalam player-area
        let videoLink = $detail('#player-area iframe, .video-content iframe, iframe').attr('src');

        if (videoLink) {
          if (videoLink.startsWith('//')) videoLink = 'https:' + videoLink;
          movies[i].streaming_url = videoLink;
        }
      } catch (err) {
        console.error("Gagal ambil link video untuk:", movies[i].title);
      }
    }

    res.status(200).json({ success: true, data: movies });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};
