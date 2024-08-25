import { PineconeClient } from 'pinecone-client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_BASE_URL = process.env.PINECONE_BASE_URL;
const INDEX_NAME = "rmp";

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const pineconeClient = new PineconeClient({
  apiKey: PINECONE_API_KEY,
  baseUrl: PINECONE_BASE_URL,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { query } = req.body;
    
    try {
        const response = await genAI.generateEmbedding({
        content: query,
        model: "text-embedding-004",
      });

      const queryEmbedding = response.embedding;

      const index = pineconeClient.Index(INDEX_NAME);
      const searchResponse = await index.query({
        vector: queryEmbedding,
        top_k: 3,
        namespace: "ns1",
      });

      const topProfessors = searchResponse.matches.map(match => ({
        name: match.id,
        ...match.metadata
      }));

      res.status(200).json({ topProfessors });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to perform search' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
