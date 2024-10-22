import { useState } from "react";
import "./TextGen.scss";
import axios from "axios";
import { FiSearch } from "react-icons/fi";
//import config from "../../config";
import ImageGen from "../ImageGen/ImageGen";

//const apiKey = config.OpenAiKey;
const apiKey = process.env.REACT_APP_GPT_KEY;

function OpenAi() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState('text'); // 'text' or 'image'
  const [contentType, setContentType] = useState("Full Article");
  const [writingTone, setWritingTone] = useState("Professional");

  const contentOptions = ["Full Article", "Outline", "Summarize", "Translate", "Rephrase", "Continue Writing", "Custom Instructions"];
  const toneOptions = [
    "Professional", "Casual", "Technical", "Adventurous", "Witty"
  ];

  // 프롬프트 파이프라이닝
  const generatePrompt = (query) => {
    return `You are a korean document writing assistant. 
    Please ${contentType.toLowerCase()} the following: ${query} with ${writingTone} tone.`;
  };

  const handleSearch = async () => {
    setIsSearching(true);
    const prompt = generatePrompt(searchQuery);
    const result = await getGPT4Response(prompt);
    setSearchResults(result);
    setIsSearching(false);
  };

  function copyResult() {
    navigator.clipboard
      .writeText(searchResults)
      .then(() => {
        alert("Result copied to clipboard!");
      })
      .catch((err) => {
        console.log("Failed to copy result: ", err);
      });
  }

  async function getGPT4Response(searchQuery) {
    //
    const url = 'https://api.openai.com/v1/chat/completions';

    try {
      const response = await axios.post(url, {
        model: 'gpt-4o-mini',  // Use 'gpt-4-turbo' or the model version you want
        messages: [
          { role: 'user', content: searchQuery }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        }
      });

      // 응답 내용 추출
      const gptResponse = response.data.choices[0].message.content;
      setSearchResults(gptResponse);
      return gptResponse;

    } catch (error) {
      console.error('Error fetching GPT-4 response:', error);
      setSearchResults("An error occurred while processing your request.");
      return 'An error occurred while processing your request.';
    }
  }

  return (
    <div className="openAi">
      <div className="toggle-container">
        <button
          className={`toggle-button ${selectedTab === "text" ? "active" : ""}`}
          onClick={() => setSelectedTab("text")}
        >
          Text
        </button>
        <button
          className={`toggle-button ${selectedTab === "image" ? "active" : ""}`}
          onClick={() => setSelectedTab("image")}
        >
          Image
        </button>
      </div>

      {/* 조건부 렌더링: 텍스트 선택 시 OpenAI 창, 이미지 선택 시 빈 창 */}
      {selectedTab === 'text' ? (
        <>
          {/* 드롭다운 메뉴: Content Type 및 Writing Tone */}
          <div className="option-drawer">
            <div className="dropdown">
              <label htmlFor="content-type">Content type</label>
              <select
                id="content-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                {contentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="dropdown">
              <label htmlFor="writing-tone">Writing Tone</label>
              <select
                id="writing-tone"
                value={writingTone}
                onChange={(e) => setWritingTone(e.target.value)}
              >
                {toneOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 검색창 */}
          <div className="wrap">
            <div className="search">
              <input
                type="text"
                className="searchTerm"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="searchButton" onClick={handleSearch}>
                <FiSearch className="searchIcon"></FiSearch>
              </button>
            </div>
          </div>

          {/* 결과 및 복사 버튼 */}
          <div className="flex-column">
            <textarea className="result" type="text" value={searchResults} readOnly></textarea>
            <button className="copy-btn" onClick={copyResult}>Copy Result</button>
          </div>
        </>
      ) : (
        <div className="image-placeholder">
          <ImageGen />
        </div>
      )}
    </div>
  );

}

export default OpenAi;
