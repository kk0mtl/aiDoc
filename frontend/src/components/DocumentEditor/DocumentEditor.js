import "./DocumentEditor.css";
import { useEffect, useCallback, useState } from "react";
import Quill from "quill";
import { io } from "socket.io-client";
import "quill/dist/quill.snow.css";
import { useParams, Link } from "react-router-dom";
import OpenAi from "../TextGen/TextGen";
import Logo from "../../Assets/LOGO.png";

const OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  ["clean"],
];

function DocumentEditor() {
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("Untitled Document");
  const [socket, setSocket] = useState();
  const [content, setContent] = useState();
  const [quill, setQuill] = useState();
  const { id: docID } = useParams();
  const [isOpenAIVisible, setIsOpenAIVisible] = useState(true);

  // 쿼리 파라미터로 전달된 userName 확인
  const params = new URLSearchParams(window.location.search);
  let userName = params.get('userName') || sessionStorage.getItem("user"); // 쿼리 또는 세션에서 사용자 이름 가져오기
  console.log(userName); // 사용자 이름 출력

  const toggleOpenAISection = () => {
    setIsOpenAIVisible((prev) => !prev);
  };

  function shareDocument() {
    const link = document.location.href;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch((err) => {
        console.log("Failed to copy link: ", err);
      });
  }

  function handleTitleChange(newTitle) {
    setTitle(newTitle);
    socket.emit("update-title", { docID, title });
  }

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: OPTIONS,
      },
    });
    q.disable();
    q.setText("Loading the document...");
    setQuill(q);
  }, []);

  // WebSocket으로 사용자 연결 및 해제 처리
  useEffect(() => {
    if (!socket) return;

    // 새로운 사용자가 접속했을 때
    socket.on('user-connected', (userName) => {
      setUsers((prevUsers) => [...prevUsers, userName]);
    });

    // 사용자가 연결을 끊었을 때
    socket.on('user-disconnected', (userName) => {
      setUsers((prevUsers) => prevUsers.filter((user) => user !== userName));
    });

    // 사용자가 접속 시 서버에 자신의 이름을 알림
    socket.emit('join-document', { userName, docID });

    return () => {
      socket.emit('leave-document', { userName, docID });
      socket.off('user-connected');
      socket.off('user-disconnected');
    };
  }, [socket, userName, docID]);

  useEffect(() => {
    const s = io("http://localhost:8080", {
      origin: "http://localhost:3030/",
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3030",
      },
    });

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null) return;
    socket.on("title-updated", (title) => setTitle(title));
  }, [socket]);

  useEffect(() => {
    if (socket == null) return;
    socket.on("save-changes", () => { });

  }, [socket]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit("get-document", docID);
  }, [socket, quill, docID]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  return (
    <div>
      <div id="header">
        <div className="flex">
          <Link to="/dashboard">
            <img src={Logo} alt="Logo" />
          </Link>
          <input
            id="text"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </div>
        <div id="share">
          <button onClick={() => shareDocument()}>Share</button>
        </div>
      </div>
      <div className="documents">
        <div id="container" ref={wrapperRef}></div>
        <div>
          <h3>Connected Users:</h3>
          <ul>
            {users.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
          <div className={`openai-drawer ${isOpenAIVisible ? 'open' : 'closed'}`}>
            <OpenAi />
          </div>
          <button
            className="openai-toggle-button"
            style={{
              right: isOpenAIVisible ? "400px" : "0",
            }}
            onClick={toggleOpenAISection}
          >
            {isOpenAIVisible ? ">" : "<"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentEditor;
