import sys
import json
import os
from dotenv import load_dotenv
import google.generativeai as genai
from pinecone import Pinecone

load_dotenv()

# Load API keys
GOOGLE_API_KEY = os.getenv('NEXT_PUBLIC_GENAI_API_KEY')
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

# Initialize Google Generative AI
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)

# Check if the index exists
index_name = "rmp"
index = pc.Index(index_name)

# Read input query from stdin
input_data = sys.stdin.read()
input_json = json.loads(input_data)
query = input_json.get("query")

if not query:
    print(json.dumps({"error": "Query not provided"}))
    sys.exit(1)

# Generate embeddings for the query
response = genai.embed_content(
    content=query,
    model="models/text-embedding-004"
)

if 'embedding' in response:
    embedding = response['embedding']
else:
    print(json.dumps({"error": "Failed to generate embeddings"}))
    sys.exit(1)

# Query the Pinecone index
query_response = index.query(
    vector=embedding,
    top_k=3,
    include_values=False,
    include_metadata=True,
    namespace="ns1",
)

top_professors = []
for match in query_response["matches"]:
    professor = {
        "name": match["id"],
        "review": match["metadata"]["review"],
        "subject": match["metadata"]["subject"],
        "stars": match["metadata"]["stars"],
    }
    top_professors.append(professor)

# Output the top professors as JSON
print(json.dumps({"topProfessors": top_professors}))
