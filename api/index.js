const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // Biar ga kena CORS saat dipanggil dari GitHub Pages
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const domain = 'https://drama-id.com'; // Sesuaikan dengan target scrape kamu
    const { data } = await axios.get(domain, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0 Safari/537.36' }
    });
    
    const $ = cheerio.load(data);
    const movies = [];

    // 1. Ambil daftar film dari halaman depan
    $('.media-block').each((i, el) => {
      if (i < 10) { // Kita batasi 10 film biar satset & ga kena limit Vercel
        movies.push({
          title: $(el).find('.title-main').text().trim(),
          image: $(el).find('img').attr('src'),
          detail_url: $(el).find('a').attr('href'),
          streaming_url: null // Awalnya kosong
        });
      }
    });

    // 2. Loop untuk masuk ke halaman detail & ambil link videonya
    for (let i = 0; i < movies.length; i++) {
      try {
        const detailRes = await axios.get(movies[i].detail_url, { timeout: 3000 });
        const $detail = cheerio.load(detailRes.data);
        
        // Cari iframe atau link video (Selector ini sering berubah, pastikan pas)
        let videoLink = $detail('iframe').attr('src') || $detail('video source').attr('src');

        if (videoLink) {
          // Pastikan link lengkap (absolut)
          if (videoLink.startsWith('//')) videoLink = 'https:' + videoLink;
          if (videoLink.startsWith('/')) videoLink = domain + videoLink;
          
          movies[i].streaming_url = videoLink;
        }
      } catch (err) {
        console.log(`Gagal ambil detail film ke-${i}`);
      }
    }

    res.status(200).json({
      success: true,
      data: movies
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
