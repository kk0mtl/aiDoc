import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
import config from "../../config"; // API 키를 가져오는 모듈
import './ImageGen.css'; // 필요한 경우 CSS 파일 포함

const apiKey = config.OpenAiKey; // OpenAI API 키

function ImageGen() {
    const [prompt, setPrompt] = useState(""); // 기본 프롬프트 입력
    const [editPrompt, setEditPrompt] = useState(""); // 수정 프롬프트 입력
    const [imageUrlList, setImageUrlList] = useState([]); // 생성된 이미지 URL 목록
    const [selectedImage, setSelectedImage] = useState(null); // 선택된 이미지 URL
    const [maskImage, setMaskImage] = useState(null); // 마스크 이미지
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태
    const [numImages, setNumImages] = useState(1); // 생성할 이미지 수
    const [imageSize, setImageSize] = useState("512x512"); // 이미지 크기 선택

    const downloadImage = async (imageUrl) => {
        try {
            const response = await axios.post('http://localhost:8080/download-image', {
                imageUrl, // 다운로드할 이미지 URL
            });

            console.log('이미지 다운로드 성공:', response.data.imagePath);
            return response.data.imagePath; // 다운로드된 이미지의 로컬 경로 반환
        } catch (error) {
            console.error('이미지 다운로드 중 오류 발생:', error);
        }
    };

    // 다운로드한 이미지 사용
    const handleDownloadAndEditImage = async () => {
        const downloadedImagePath = await downloadImage(selectedImage); // 서버에서 이미지를 다운로드

        if (downloadedImagePath) {
            setSelectedImage(downloadedImagePath); // 로컬 경로를 사용해 이미지 수정
            // 이후 수정 작업을 진행...
        }
    };

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

    // 이미지 편집 함수 (inpainting)
    const editImage = async () => {
        if (!editPrompt || !selectedImage) {
            alert("수정할 내용을 입력하세요.");
            return;
        }

        setIsLoading(true);
        try {
            // 수정할 프롬프트를 영어로 번역
            const translatedPrompt = await translatePrompt(editPrompt);

            const formData = new FormData();
            const response = await fetch(selectedImage); // 로컬 경로의 이미지를 가져옴
            const blob = await response.blob(); // URL을 Blob으로 변환
            formData.append("image", blob); // 이미지 파일 추가
            formData.append("prompt", translatedPrompt); // 프롬프트 추가
            formData.append("n", 1); // 이미지 개수
            formData.append("size", "512x512"); // 이미지 크기

            const editResponse = await axios.post(
                "https://api.openai.com/v1/images/edits",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data", // multipart/form-data 형식
                        Authorization: `Bearer ${apiKey}`,
                    },
                }
            );

            const newUrl = editResponse.data.data[0].url;
            const updatedImageList = imageUrlList.map((url) =>
                url === selectedImage ? newUrl : url // 기존 이미지를 새 이미지로 교체
            );
            setImageUrlList(updatedImageList);
        } catch (error) {
            console.error("이미지 편집 중 오류 발생:", error.response ? error.response.data : error.message);
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

            {/* 선택한 이미지 수정 섹션 */}
            {selectedImage && (
                <div className="wrap">
                    <h3>이미지 수정</h3>
                    <input
                        type="text"
                        className="searchTerm"
                        placeholder="수정할 내용을 입력하세요"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                    />
                    <button type="submit" className="searchButton" onClick={editImage} disabled={isLoading}>
                        {isLoading ? "수정 중" : <FiSearch className="searchIcon" />}
                    </button>
                </div>
            )}
        </div>
    );
}

export default ImageGen;
