import puppeteer from 'puppeteer';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(url);

            const content = await page.content();
            await browser.close();

            const $ = require('cheerio').load(content);

            const professorName = $('h1[id="profname"]').text().trim();
            const department = $('span[id="profdepartment"]').text().trim();
            const rating = $('div[data-testid="rating-value"]').text().trim();
            const wouldTakeAgain = $('div[data-testid="would-take-again-value"]').text().trim();
            const difficulty = $('div[data-testid="difficulty-value"]').text().trim();

            res.status(200).json({
                professorName,
                department,
                rating,
                wouldTakeAgain,
                difficulty,
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to scrape the page' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
