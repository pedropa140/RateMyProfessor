// /app/api/chat.js

import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PineconeClient } from '@pinecone-database/pinecone';

// Initialize Google Generative AI and Pinecone clients
const generativeAI = new GoogleGenerativeAI({
  apiKey: process.env.PUBLIC_NEXT_GENAI_API_KEY,
});

const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY,
  environment: 'us-east-1', // Update with your Pinecone environment
});

export async function POST(req) {
  const { messages } = await req.json();
  const userMessage = messages[messages.length - 1].content.toLowerCase();

  // Load the JSON file with reviews
  const filePath = path.resolve(process.cwd(), 'public/reviews.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const reviews = JSON.parse(fileContents).reviews;

  // Step 1: Search for a matching review in the JSON file
  const matchingReview = reviews.find(review => 
    userMessage.includes(review.professor.toLowerCase()) || 
    userMessage.includes(review.subject.toLowerCase())
  );

  // If no matching review is found, proceed with AI-based processing
  let responseContent;
  if (matchingReview) {
    responseContent = `Here's a review for ${matchingReview.professor} who teaches ${matchingReview.subject}: "${matchingReview.review}" Rated: ${matchingReview.stars} stars.`;
  } else {
    // Step 2: Use Gemini AI to generate an embedding of the user message
    const embeddingResponse = await generativeAI.embeddings({
      model: 'text-embedding-004',
      input: userMessage,
    });
    
    const userEmbedding = embeddingResponse.data[0].embedding;

    // Step 3: Query Pinecone to find the most similar review
    const queryResponse = await pinecone.query({
      indexName: 'rate-my-professor',
      queryVector: userEmbedding,
      topK: 1,
      includeMetadata: true,
    });

    // Get the top result from Pinecone
    const topResult = queryResponse.matches[0]?.metadata.content || 'No relevant review found.';

    // Step 4: Use Gemini AI to generate a response based on Pinecone result
    const response = await generativeAI.completions({
      model: 'text-bison-001',
      prompt: `Based on the following information from Pinecone: "${topResult}", respond to the user message: "${userMessage}"`,
      temperature: 0.7,
    });

    responseContent = response.data[0].text || 'Sorry, I could not find any relevant information.';
  }

  return new Response(JSON.stringify({ content: responseContent }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
