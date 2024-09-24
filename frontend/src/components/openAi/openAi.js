import { useEffect, useState } from "react";
import "./openAi.scss";
import axios from "axios";
import { FiSearch } from "react-icons/fi";
import config from "../../config";

const apiKey = config.OpenAiKey;
// const openAiKey = process.env.REACT_APP_OPENAI_API_KEY;
// console.log(openAiKey);

function OpenAi() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
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
          'Authorization': apiKey,
        }
      });

      // Extracting the response content
      const gptResponse = response.data.choices[0].message.content;
      setSearchResults(gptResponse);
      return gptResponse;

    } catch (error) {
      console.error('Error fetching GPT-4 response:', error);
      setSearchResults("An error occurred while processing your request.");
      return 'An error occurred while processing your request.';
    }
  }


  useEffect(() => {
    if (isSearching) {
      getGPT4Response(searchQuery);
    }
  }, [isSearching, searchQuery]);

  console.log(searchResults);

  return (
    <div className="openAi">
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
      <div className="flex-column">
        <textarea className="result" type="text" value={searchResults}></textarea>
        <button className="copy-btn" onClick={() => copyResult()}>Copy Result</button>
      </div>
    </div>
  );
}

export default OpenAi;
