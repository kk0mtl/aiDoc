import "./DocumentEditor.css";
import { useEffect, useCallback, useState } from "react";
import Quill from "quill";
import { io } from "socket.io-client";
import "quill/dist/quill.snow.css";
import { Link } from "react-router-dom";
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
  const [quill, setQuill] = useState();
  const [isOpenAIVisible, setIsOpenAIVisible] = useState(true);

  // 쿼리 파라미터로 전달된 userName 및 roomId 확인
  const params = new URLSearchParams(window.location.search);
  let userName = params.get('userName') || sessionStorage.getItem("user");
  let roomId = params.get('roomId');
  console.log(`UserName: ${userName}`); // 사용자 이름 출력

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

  function handleTitleChange(e) {
    const newTitle = e.target.value;
    setTitle(newTitle);
    console.log(`Updating title to: ${newTitle}`);
    socket.emit("update-title", { roomId, newTitle });
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

    // 서버로부터 사용자 목록 업데이트 수신
    socket.on("update-user-list", (userList) => {
      console.log("Updated user list:", userList);
      setUsers(userList); // 사용자 목록 업데이트
    });

    // 사용자가 접속 시 서버에 자신의 이름을 알림
    console.log(`Joining room: ${roomId} as ${userName}`);
    socket.emit('join-room', { userName, roomId });

    return () => {
      console.log(`Leaving room: ${roomId}`);
      socket.emit('leave-room', { userName, roomId });
      socket.off("update-user-list");
    };
  }, [socket, userName, roomId]);

  // WebSocket 연결 설정
  useEffect(() => {
    const s = io("http://localhost:8080", {
      origin: "http://localhost:3030/",
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3030",
      },
    });

    setSocket(s);
    return () => {
      console.log("Disconnecting socket");
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null) return;
    socket.on("title-updated", (newTitle) => {
      setTitle(newTitle);
      console.log(`Title updated to: ${newTitle}`);
    });
  }, [socket]);

  useEffect(() => {
    if (socket == null) return;
    socket.on("save-changes", () => {
      console.log("Changes saved");
    });
  }, [socket]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      console.log("Document loaded", document);
      quill.setContents(document);
      quill.enable();
    });

    console.log(`Getting document for room: ${roomId}`);
    socket.emit("get-document", roomId);
  }, [socket, quill, roomId]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      console.log("Received changes", delta);
      quill.updateContents(delta); // 변경 내용 적용
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
      console.log("Sending changes", delta);
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
            value={title} // 상태 값을 입력 필드의 값으로 설정
            onChange={handleTitleChange} // 변경 이벤트 처리
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
