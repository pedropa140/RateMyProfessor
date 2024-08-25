import { PineconeClient } from "@pinecone-database/pinecone";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { query } = req.body;
    
    try {
      const client = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY });
      const index = client.index("rmp");
      
      // Example: Fetch top professors by stars
      const results = await index.query({
        topK: 3,
        includeMetadata: true,
        filter: {
          // Adjust the filter condition to match your specific query needs.
          stars: { $gte: 4.5 }, // Example filter for top-rated professors
        },
        namespace: "ns1",
      });

      // Sort by stars if not handled by the query itself
      const sortedResults = results.matches.sort((a, b) => b.metadata.stars - a.metadata.stars);
      
      const topProfessors = sortedResults.map(match => ({
        name: match.id,
        subject: match.metadata.subject,
        stars: match.metadata.stars,
      }));

      res.status(200).json({ topProfessors });
    } catch (error) {
      console.error("Error querying Pinecone:", error);
      res.status(500).json({ error: "Failed to query Pinecone" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}