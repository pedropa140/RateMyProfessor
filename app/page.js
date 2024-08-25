'use client'
// app/page.js
// Ensure this file is in 'pages' directory if using Next.js 13 or below, otherwise update paths for Next.js 14.

import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { IconButton } from "@mui/material";
import { ThumbDown, ThumbDownOutlined, ThumbUp, ThumbUpOutlined, Refresh } from "@mui/icons-material";
import styled from "@emotion/styled";

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  '&:hover': {
    color: "#ba000d",
  },
  '&.active': {
    color: "#ba000d",
  },
}));

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const handleSendMessage = async (replacePrompt = false) => {
    try {
      if (userInput.trim() === '') return;
      const userMessage = {
        text: userInput,
        role: "user",
        timestamp: new Date(),
        thumbsUp: false,
        thumbsDown: false,
      };
  
      setMessages((prevMessages) => [...prevMessages, userMessage]);
  
      // Fetch top professors from the API
      const searchResponse = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userInput }),
      });
  
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error("API response error:", errorText);
        throw new Error(`Failed to fetch: ${searchResponse.status}`);
      }
  
      const searchData = await searchResponse.json();
      const topProfessors = searchData.topProfessors;
  
      const botMessage = {
        text: `Here are the top 3 professors based on your query:\n\n${topProfessors.map(p => `Professor: ${p.name}\nSubject: ${p.subject}\nRating: ${p.stars}\n`).join("\n")}`,
        role: "bot",
        timestamp: new Date(),
        thumbsUp: false,
        thumbsDown: false,
      };
  
      if (replacePrompt) {
        setMessages((prevMessages) => prevMessages.map((msg, idx) => {
          if (msg.role === "user" && !msg.thumbsUp && !msg.thumbsDown) {
            return { ...msg, text: botMessage.text };
          }
          return msg;
        }));
      } else {
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
  
      setUserInput('');
    } catch (error) {
      setError("Failed to Send Message. Please Try Again" + error);
    }
  };
  

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleButtonClick = (index, button) => {
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((msg, idx) => {
        if (idx === index) {
          if (msg.feedbackGiven) {
            return msg;
          }

          if (button === 'thumbDown') {
            return {
              ...msg,
              thumbsUp: false,
              thumbsDown: true,
              feedbackGiven: true,
            };
          } else if (button === 'thumbUp') {
            return {
              ...msg,
              thumbsUp: true,
              thumbsDown: false,
              feedbackGiven: true,
            };
          }
        }
        return msg;
      });

      const thankYouMessageExists = updatedMessages.some((msg) => msg.text === "Thank you for your feedback!");

      if (!thankYouMessageExists) {
        const thankYouMessage = {
          text: "Thank you for your feedback!",
          role: "bot",
          timestamp: new Date(),
          thumbsUp: false,
          thumbsDown: false,
          feedbackGiven: true,
        };
        updatedMessages.push(thankYouMessage);
      }

      return updatedMessages;
    });
  };

  const handleRefreshClick = async (index) => {
    try {
      const originalUserMessage = messages[index - 1];

      if (originalUserMessage && originalUserMessage.role === "user") {
        await handleSendMessage(true);
      }
    } catch (error) {
      setError("Failed to regenerate the response. Please try again.");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex justify-center">
        <div className="w-full max-w-md p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === "bot" ? "bot-message" : "user-message"}`}
              >
                <p>{message.text}</p>
                {!message.feedbackGiven && message.role === "bot" && (
                  <div className="feedback-buttons">
                    <StyledIconButton
                      onClick={() => handleButtonClick(index, 'thumbUp')}
                      className={message.thumbsUp ? 'active' : ''}
                    >
                      <ThumbUpOutlined />
                    </StyledIconButton>
                    <StyledIconButton
                      onClick={() => handleButtonClick(index, 'thumbDown')}
                      className={message.thumbsDown ? 'active' : ''}
                    >
                      <ThumbDownOutlined />
                    </StyledIconButton>
                    <StyledIconButton onClick={() => handleRefreshClick(index)}>
                      <Refresh />
                    </StyledIconButton>
                  </div>
                )}
              </div>
            ))}
            {error && <p className="text-red-500">{error}</p>}
          </div>
          <div className="mt-4">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              rows="4"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleSendMessage}
              className="mt-2 w-full p-2 bg-blue-500 text-white rounded-md"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
