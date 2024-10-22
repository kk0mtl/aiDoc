import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
//import config from "../../config"; // API 키를 가져오는 모듈
import './ImageGen.css'; // 필요한 경우 CSS 파일 포함

//const apiKey = config.OpenAiKey; // OpenAI API 키
const apiKey = process.env.REACT_APP_GPT_KEY;

function ImageGen() {
    const [prompt, setPrompt] = useState(""); // 기본 프롬프트 입력
    const [imageUrlList, setImageUrlList] = useState([]); // 생성된 이미지 URL 목록
    const [selectedImage, setSelectedImage] = useState(null); // 선택된 이미지 URL
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태
    const [numImages, setNumImages] = useState(1); // 생성할 이미지 수
    const [imageSize, setImageSize] = useState("512x512"); // 이미지 크기 선택

    // GPT-4를 사용해 프롬프트를 영어로 번역하는 함수
    const translatePrompt = async (prompt) => {
        try {
            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-4", // GPT-4 모델 사용
                    messages: [
                        { role: "system", content: "Translate the following prompt into English:" },
                        { role: "user", content: prompt }
                    ]
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                }
            );

            const translation = response.data.choices[0].message.content.trim();
            return translation; // 번역된 프롬프트 반환
        } catch (error) {
            console.error("프롬프트 번역 중 오류 발생:", error);
            return prompt; // 오류 발생 시 원래 프롬프트 반환
        }
    };

    // 이미지 생성 함수
    const generateImage = async () => {
        if (!prompt) {
            alert("이미지 생성에 필요한 설명을 입력하세요.");
            return;
        }

        setIsLoading(true);
        try {
            // 프롬프트를 영어로 번역
            const translatedPrompt = await translatePrompt(prompt);

            const response = await axios.post(
                "https://api.openai.com/v1/images/generations",
                {
                    prompt: translatedPrompt, // 번역된 프롬프트 사용
                    n: numImages, // 선택한 이미지 수 사용
                    size: imageSize, // 선택한 이미지 크기 사용
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                }
            );

            const urls = response.data.data.map(item => item.url);
            setImageUrlList(urls);

        } catch (error) {
            console.error("이미지 생성 중 오류 발생:", error.response ? error.response.data : error.message);
            setImageUrlList([]); // 에러가 발생한 경우 빈 목록
        } finally {
            setIsLoading(false); // 로딩 상태 종료
        }
    };

    return (
        <div className="image-gen">
            <h2>이미지 생성 (DALL·E)</h2>

            {/* 드롭다운 옵션: 이미지 수와 이미지 크기 */}
            <div className="options-row">
                <div className="dropdown">
                    <label htmlFor="num-images">이미지 수</label>
                    <select
                        id="num-images"
                        value={numImages}
                        onChange={(e) => setNumImages(parseInt(e.target.value))}
                    >
                        {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>
                                {num} 개
                            </option>
                        ))}
                    </select>
                </div>

                <div className="dropdown">
                    <label htmlFor="image-size">이미지 크기</label>
                    <select
                        id="image-size"
                        value={imageSize}
                        onChange={(e) => setImageSize(e.target.value)}
                    >
                        {["256x256", "512x512", "1024x1024"].map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 기본 프롬프트 입력 */}
            <div className="wrap">
                <div className="search">
                    <input
                        type="text"
                        className="searchTerm"
                        placeholder="생성할 이미지에 대한 설명을 입력하세요"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button type="submit" className="searchButton" onClick={generateImage} disabled={isLoading}>
                        {isLoading ? "생성 중" : <FiSearch className="searchIcon" />}
                    </button>
                </div>
            </div>

            {/* 생성된 이미지 리스트 */}
            {imageUrlList.length > 0 && (
                <div className="image-preview">
                    {imageUrlList.map((url, index) => (
                        <div
                            key={index}
                            className={`image-container ${selectedImage === url ? "selected" : ""}`}
                        >
                            <span>이미지 {index + 1}</span>
                            <img
                                src={url}
                                alt={`Generated by DALL·E ${index + 1}`}
                                onClick={() => setSelectedImage(url)} // 이미지 선택
                            />
                            <button onClick={() => setSelectedImage(url)}>이미지 선택</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ImageGen;
