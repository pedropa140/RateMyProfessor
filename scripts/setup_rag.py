# setup_rag.py

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

# Load the review data with explicit encoding
script_dir = os.path.dirname(__file__)
data_file = os.path.join(script_dir, "../data/reviews.json")

print(f"Data file path: {data_file}")

with open(data_file, encoding='utf-8') as f:  # Ensure correct encoding
    data = json.load(f)

processed_data = []

# Function to clean up misencoded characters
def clean_text(text):
    # Replace misencoded apostrophe
    return text.replace("â€™", "'")

# Use the correct method to generate embeddings
for review in data["reviews"]:
    # Clean up the review text before embedding
    cleaned_review = clean_text(review['review'])
    
    response = genai.embed_content(
        content=cleaned_review,
        model="models/text-embedding-004"  # Use the correct model name
    )
    
    if 'embedding' in response:
        embedding = response['embedding']
        if isinstance(embedding, list):
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
                "review": cleaned_review,  # Use cleaned review here
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
