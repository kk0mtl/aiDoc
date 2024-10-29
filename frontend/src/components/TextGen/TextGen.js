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
  const [contentType, setContentType] = useState("전체");
  const [writingTone, setWritingTone] = useState("전문적인");

  const contentOptionsKo = ["전체", "개요", "요약", "번역", "다시쓰기", "이어쓰기"];
  const toneOptionsKo = [
    "전문적인", "편한", "기술적인", "탐구적인", "위트있는"
  ];

  const contentOptionsEn = ["Full Article", "Outline", "Summarize", "Translate", "Rephrase", "Continue Writing"];
  const toneOptionsEn = [
    "Professional", "Casual", "Technical", "Adventurous", "Witty"
  ];

  const mapToEnglish = (option, isContent) => {
    const index = isContent ? contentOptionsKo.indexOf(option) : toneOptionsKo.indexOf(option);
    if (index === -1) {
      console.warn(`No matching English option for: ${option}`);
      return isContent ? "Full Article" : "Professional"; // Default values if mapping fails
    }
    return isContent ? contentOptionsEn[index] : toneOptionsEn[index];
  };

  // 프롬프트 파이프라이닝
  const generatePrompt = (query) => {
    const englishContentType = mapToEnglish(contentType, true);
    const englishWritingTone = mapToEnglish(writingTone, false);

    return `You are a korean document writing assistant. 
    Please ${englishContentType.toLowerCase()} the following: ${query} with ${englishWritingTone} tone.`;
  };

  const handleContentTypeChange = (e) => {
    const selectedKorean = e.target.value;
    setContentType(selectedKorean);
  };

  const handleWritingToneChange = (e) => {
    const selectedKorean = e.target.value;
    setWritingTone(selectedKorean);
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
              <label htmlFor="content-type">문서 타입</label>
              <select
                id="content-type"
                value={contentType}
                onChange={handleContentTypeChange}
              >
                {contentOptionsKo.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="dropdown">
              <label htmlFor="writing-tone">사용할 톤</label>
              <select
                id="writing-tone"
                value={writingTone}
                onChange={handleWritingToneChange}
              >
                {toneOptionsKo.map((option, index) => (
                  <option key={index} value={option}>
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
                placeholder="여기에 내용을 입력하세요."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="searchButton" onClick={handleSearch}>
                {isSearching ? "생성 중" : <FiSearch className="searchIcon" />}
              </button>
            </div>
          </div>

          {/* 결과 및 복사 버튼 */}
          <div className="flex-column">
            <textarea
              className="result"
              type="text"
              placeholder="문서 어시스턴트는 GPT를 기반으로 합니다. GPT는 실수할 수 있습니다. 어시스턴트의 응답은 참고용으로, 검토와 수정이 필요합니다."
              value={isSearching ? "응답 생성 중..." : searchResults}
              readOnly></textarea>
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
