"use client"
import { useState } from "react";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { IconButton } from "@mui/material";
import { ThumbDown, ThumbDownAltOutlined, ThumbDownOutlined, ThumbUp, ThumbUpOutlined, Refresh } from "@mui/icons-material";
import styled from "@emotion/styled";
import ReactStars from 'react-stars';

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(null);
  const [theme, setTheme] = useState("light");
  const [error, setError] = useState(null);

  const MODEL_NAME = "gemini-1.5-flash";
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GENAI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const StyledIconButton = styled(IconButton)(({ theme }) => ({
    '&:hover': {
      color: "#ba000d",
    },
    '&.active': {
      color: "#ba000d",
    },
  }));

  const handleButtonClick = async (index, button) => {
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
        const result = await model.generateContent(originalUserMessage.text);
        const response = await result.response;
        const markdownText = response.text();

        let formattedText = markdownText
          .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
          .replace(/^\* /gm, "<li>")
          .replace(/<\/li>\s*<li>/g, "</li><li>")
          .replace(/<\/li>\s*$/g, "</li>")
          .replace(/<li>/g, "<li>")
          .replace(/<\/li>/g, "</li>")
          .replace(/^(<li>.*<\/li>\s*)+$/gm, "<ul>$&</ul>")
          .replace(/\n/g, "<br>");

        const newBotMessage = {
          text: formattedText,
          role: "bot",
          timestamp: new Date(),
          thumbsUp: false,
          thumbsDown: false,
        };

        setMessages((prevMessages) =>
          prevMessages.map((msg, idx) => (idx === index ? newBotMessage : msg))
        );
      }
    } catch (error) {
      setError("Failed to regenerate the response. Please try again.");
    }
  };

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

      const result = await model.generateContent(userInput);
      const response = await result.response;
      const markdownText = response.text();

      let formattedText = markdownText
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/^\* /gm, '<li>')
        .replace(/<\/li>\s*<li>/g, '</li><li>')
        .replace(/<\/li>\s*$/g, '</li>')
        .replace(/<li>/g, '<li>')
        .replace(/<\/li>/g, '</li>')
        .replace(/^(<li>.*<\/li>\s*)+$/gm, '<ul>$&</ul>')
        .replace(/\n/g, '<br>');

      const botMessage = {
        text: formattedText,
        role: "bot",
        timestamp: new Date(),
        thumbsUp: false,
        thumbsDown: false,
      };

      if (replacePrompt) {
        setMessages((prevMessages) => prevMessages.map((msg, idx) => {
          if (msg.role === "user" && !msg.thumbsUp && !msg.thumbsDown) {
            return { ...msg, text: formattedText };
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

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const getThemeColors = () => {
    switch (theme) {
      case "light":
        return {
          primary: "bg-white",
          secondary: "bg-gray-100",
          accent: "bg-blue-500",
          text: "text-gray-800",
        };
      case "dark":
        return {
          primary: "bg-gray-900",
          secondary: "bg-gray-800",
          accent: "bg-blue-500",
          text: "text-black-100",
        };
      default:
        return {
          primary: "bg-white",
          secondary: "bg-gray-100",
          accent: "bg-blue-500",
          text: "text-gray-800",
        };
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const { primary, secondary, accent, text } = getThemeColors();

  const handleRatingChange = (newRating) => {
    let message;

    switch (newRating) {
      case 0:
        message = "Sorry you didn't like this :(, would you like to tell us what could we improve on?";
        break;
      case 3:
        message = "Thank you for rating us! If anything what could we improve on?";
        break;
      case 5:
        message = "Wow! Glad you liked this. Nothing's ever perfect, is there anything you feel we could improve on?";
        break;
      default:
        message = "Thank you for your feedback!";
        break;
    }

    alert(message);
  };

  return (
    <div className={`flex flex-col h-screen p-4 ${primary}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className={`text-2xl font-bold ${text}`}>Rate My Professor AI Chat</h1>
        <div className="flex flex-col items-center justify-center">
          <h2 className={theme === "dark" ? "text-white" : "text-black"}>
            Rate the ChatBot
          </h2>
          <ReactStars count={5} size={24} color2={'#ffd700'} onChange={handleRatingChange} />
        </div>

        <div className="flex justify-center items-center space-x-2">
          <label htmlFor="theme" className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Theme:
          </label>
          <select
            id="theme"
            value={theme}
            onChange={handleThemeChange}
            className={`p-1 rounded-md border ${theme === 'dark' ? 'text-black' : 'text-black'} ${text}`}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

      </div>

      <div className={`flex-1 overflow-y-auto ${secondary} rounded-md p-2`}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`p-2 rounded-lg ${msg.role === "user" ? `${accent} text-white` : `${primary} ${text}`}`}
              style={{
                width: 'max-content',
                maxWidth: '80%',
                margin: msg.role === "user" ? '0 0 0 auto' : '0 auto 0 0',
                textAlign: msg.role === "user" ? 'right' : 'left',
                color: msg.role === "bot" ? (theme === "dark" ? "white" : "black") : undefined, // Set color based on theme
              }}
              {...(msg.role === "bot"
                ? { dangerouslySetInnerHTML: { __html: msg.text } }
                : { children: msg.text })}
            ></div>
            <p
              className={`text-xs mt-1`}
              style={{
                color: theme === "dark" ? "white" : "black", // Set text color based on theme
              }}
            >
              {msg.role === "bot" ? "Bot" : "You"} -{" "}
              {msg.timestamp.toLocaleTimeString()}
              {msg.role === "bot" && !msg.text.includes("Thank you for your feedback!") && (
                <div>
                  <StyledIconButton
                    className={msg.thumbsUp ? "active" : ""}
                    onClick={() => handleButtonClick(index, 'thumbUp')}
                  >
                    {msg.thumbsUp ? <ThumbUp /> : <ThumbUpOutlined />}
                  </StyledIconButton>

                  <StyledIconButton
                    className={msg.thumbsDown ? "active" : ""}
                    onClick={() => handleButtonClick(index, 'thumbDown')}
                  >
                    {msg.thumbsDown ? <ThumbDown /> : <ThumbDownOutlined />}
                  </StyledIconButton>

                  <StyledIconButton
                    className="refresh"
                    onClick={() => handleRefreshClick(index)}
                  >
                    <Refresh />
                  </StyledIconButton>
                </div>
              )}
            </p>
          </div>
        ))}
      </div>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center mt-4">
          <input
            type="text"
            placeholder="Type Your Message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className={`flex-1 p-2 rounded-md border-t border-b border-l ${text} focus:outline-none focus:border-${accent.split(' ')[0]}`}
            style={{
              backgroundColor: theme === "dark" ? "black" : "white",
              borderColor: theme === "dark" ? "black" : "white",
              color: theme === "dark" ? "white" : "black"
            }}
          />
          <button type="submit" className={`p-2 ${accent} text-white rounded-r-md hover:bg-opacity-80 focus:outline-none`}>Send</button>
        </form>

    </div>
  );
}
