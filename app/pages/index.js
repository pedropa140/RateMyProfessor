import { useState } from 'react';

export default function Home() {
    const [url, setUrl] = useState('');
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setData(null);
        setError(null);

        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h1>Web Scraper</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                />
                <button type="submit">Scrape</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {data && (
                <div>
                    <h2>Professor Information</h2>
                    <p><strong>Professor Name:</strong> {data.professorName}</p>
                    <p><strong>Department:</strong> {data.department}</p>
                    <p><strong>Rating:</strong> {data.rating}</p>
                    <p><strong>Would Take Again:</strong> {data.wouldTakeAgain}</p>
                    <p><strong>Level of Difficulty:</strong> {data.difficulty}</p>
                </div>
            )}
        </div>
    );
}
