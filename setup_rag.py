from dotenv import load_dotenv
load_dotenv()
from pinecone import Pinecone, ServerlessSpec
import os
import json
import google.generativeai as genai

# Load API keys
GOOGLE_API_KEY = os.getenv('NEXT_PUBLIC_GENAI_API_KEY')
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

# Initialize Google Generative AI
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)

# Check if the index already exists
index_name = "rmp"
response = pc.list_indexes()
existing_indexes = [index.name for index in response]
print(f"Existing indexes: {existing_indexes}")

if index_name in existing_indexes:
    print(f"Index '{index_name}' already exists. Skipping creation.")
else:
    # Create a Pinecone index if it doesn't exist
    pc.create_index(
        name=index_name,
        dimension=768,  # Adjust the dimension based on Gemini's embedding model
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    print(f"Index '{index_name}' created successfully.")

# Load the review data
with open("reviews.json") as f:
    data = json.load(f)

processed_data = []

# Use the correct method to generate embeddings
for review in data["reviews"]:
    response = genai.embed_content(
        content=review['review'],
        model="models/text-embedding-004"  # Replace with the correct model name if needed
    )
    
    # Print the response to debug
    print(f"Response: {response}")
    
    # Adjust according to the actual response structure
    if 'embedding' in response:
        embedding = response['embedding']
        if isinstance(embedding, list):
            # Ensure embedding is a list of floats
            embedding = [float(value) for value in embedding]
        else:
            raise ValueError("Embedding is not in list format")
    else:
        raise ValueError("Response does not contain 'embedding' key")

    processed_data.append(
        {
            "values": embedding,
            "id": review["professor"],
            "metadata": {
                "review": review["review"],
                "subject": review["subject"],
                "stars": review["stars"],
            }
        }
    )

# Insert the embeddings into the Pinecone index
index = pc.Index(index_name)
upsert_response = index.upsert(
    vectors=processed_data,
    namespace="ns1",
)
print(f"Upserted count: {upsert_response['upserted_count']}")

# Print index statistics
print(index.describe_index_stats())
