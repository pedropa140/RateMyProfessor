import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const dataDirectory = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDirectory, 'reviews.json');

    try {
      // Read the existing data from the file
      let fileData = await fs.readFile(filePath, 'utf8');
      console.log('File data before parsing:', fileData);  // Log file content

      let reviewsData;
      if (!fileData.trim()) {
        // Handle empty or non-existing file content
        reviewsData = { reviews: [] };
      } else {
        try {
          reviewsData = JSON.parse(fileData);
          if (!reviewsData || !Array.isArray(reviewsData.reviews)) {
            throw new Error('Data is not an array');
          }
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          return res.status(500).json({ success: false, message: 'Invalid JSON format' });
        }
      }

      // Add the new review
      const newReview = req.body;
      reviewsData.reviews.push(newReview);

      // Write the updated data back to the file
      await fs.writeFile(filePath, JSON.stringify(reviewsData, null, 2));

      // Respond with the updated reviews
      res.status(200).json({ success: true, reviews: reviewsData.reviews });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to write to file' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
