// /scripts/upsertPinecone.js

import { PineconeClient } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from 'google-generative-ai';
import fs from 'fs';
import path from 'path';

const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY,
  environment: 'us-east-1',
});

const generativeAI = new GoogleGenerativeAI({
  apiKey: process.env.PUBLIC_NEXT_GENAI_API_KEY,
});

async function upsertData() {
  const filePath = path.resolve(process.cwd(), 'public/reviews.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const reviews = JSON.parse(fileContents).reviews;

  for (const review of reviews) {
    const embeddingResponse = await generativeAI.embeddings({
      model: 'text-embedding-004',
      input: `${review.professor} ${review.subject} ${review.review}`,
    });

    const reviewEmbedding = embeddingResponse.data[0].embedding;

    await pinecone.upsert({
      indexName: 'rate-my-professor',
      vectors: [
        {
          id: `${review.professor}-${review.subject}`,
          values: reviewEmbedding,
          metadata: { content: review.review },
        },
      ],
    });
  }

  console.log('Data upserted to Pinecone.');
}

upsertData().then(() => console.log('Done.'));
