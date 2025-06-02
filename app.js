require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { startStreamingScrape, getLiveJobs } = require('./isilanlari');
const app = express();
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');
app.use(cors());
 


app.get('/api/ybs-ilanlar/start', async (req, res) => {
  startStreamingScrape(); // async başlat, bekleme
  res.json({ message: 'Tarama başladı' });
});

app.get('/api/ybs-ilanlar/live', (req, res) => {
  try {
    res.json(getLiveJobs());
  } catch (err) {
    console.log('❌ API live hata:', err.message);
    res.status(500).json({ hata: err.message });
  }
});



app.get('/ders-programi', async (req, res) => {
  
  const page = await browser.newPage();
  const browser = await chromium.puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath,
  headless: chromium.headless,
});
  try {
    await page.goto('https://iibf.deu.edu.tr/wp-courselist.php', {
      waitUntil: 'networkidle2',
      timeout: 0
    });


    await page.select('select[name="bolum"]', 'YÖNETİM BİLİŞİM SİSTEMLERİ');
    await page.select('select[name="yariyil"]', '0');
    await page.select('select[name="durum"]', 'Örgün Öğretim');
    await page.click('input[type="submit"]');

    // Ders tablosunun yüklenmesini bekle
    await page.waitForSelector('table[border="1"]');

    const dersler = await page.evaluate(() => {
      const rows = document.querySelectorAll('table[border="1"] tr');
      const data = [];

      rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 7) {
          const ders = cols[0].innerText.trim();
          const ogretmen = cols[3].innerText.trim();
          const gun = cols[4].innerText.trim();
          const saat = cols[5].innerText.trim();
          const derslik = cols[6].innerText.trim();

          data.push({ ders, ogretmen, gun, saat, derslik });
        }
      });

      return data;
    });

    res.json(dersler);
  } catch (err) {
    console.error(err);
    res.status(500).send('Hata oluştu: ' + err.message);
  } finally {
    await browser.close();
  }
});

const PORT = 3000 || process.env.PORT;
app.listen(PORT, () => console.log(`✅ Sunucu ${PORT} portunda çalışıyor.`));
