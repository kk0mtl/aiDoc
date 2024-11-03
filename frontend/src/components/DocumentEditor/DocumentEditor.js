import "./DocumentEditor.css";
import { useEffect, useCallback, useState } from "react";
import Quill from "quill";
import { io } from "socket.io-client";
import "quill/dist/quill.snow.css";
import { Link } from "react-router-dom";
import OpenAi from "../TextGen/TextGen";
import Logo from "../../Assets/LOGO.png";
import { saveAs } from 'file-saver';
import * as quillToWord from 'quill-to-word';

// Quill의 Font 모듈 가져오기
const Font = Quill.import("formats/font");

// 사용할 폰트 이름 추가
Font.whitelist = ["sans-serif", "noto-sans", "gowun-dodum", "nanum-gothic"];
Quill.register(Font, true);

const OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: ["sans-serif", "noto-sans", "gowun-dodum", "nanum-gothic"] }],
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

  // 문서를 Word로 저장하는 함수
  const saveAsWord = async () => {
    if (!quill) return;

    const delta = quill.getContents();

    // 이미지 URL로 대체
    const modifiedDelta = delta.ops.map(op => {
      if (op.insert && op.insert.image) {
        // 이미지 URL을 텍스트로 변환
        return { insert: `[이미지: ${op.insert.image}]` };
      }
      return op;
    });

    // Word 파일로 내보내기
    try {
      const docBlob = await quillToWord.generateWord({ ops: modifiedDelta }, {
        exportAs: 'blob',
        title: title,
      });

      saveAs(docBlob, `${title}.docx`);
    } catch (error) {
      console.error("Word 파일 생성 중 오류 발생:", error);
    }
  };

  // 쿼리 파라미터로 전달된 userName 및 roomId 확인
  const params = new URLSearchParams(window.location.search);
  let userName = params.get('userName') || sessionStorage.getItem("user");
  let roomId = params.get('roomId');
  console.log(`UserName: ${userName}`); // 사용자 이름 출력

  const toggleOpenAISection = () => {
    setIsOpenAIVisible((prev) => !prev);
  };

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
    const s = io(process.env.REACT_APP_BACKEND || "http://localhost:8080", {
      // origin: "http://localhost:8080/",
      // headers: {
      //   "Access-Control-Allow-Origin": "http://localhost:8080",
      // },
      transports: ['websocket', 'polling'],
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

      // 사용자의 색상 찾기
      const user = users.find(u => u.name === userName);
      const userColor = user ? user.color : "#FFFFFF"; // 사용자의 색상 또는 기본값

      // 커서 색상 변경
      const changeCaretColor = (color) => {
        quill.root.style.caretColor = color; // 커서 색상을 동적으로 변경
      };

      // 페이지 로드 시 한 번 커서 색상 설정
      changeCaretColor(userColor);

      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill, users, userName]);


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
          <div id="user-now">
            <ul>
              {users.map((user, index) => (
                <li key={index} style={{ backgroundColor: user.color }}>{user.name}</li>
              ))}
            </ul>
          </div>
        </div>
        <div id="share">
          <button onClick={saveAsWord}>Download</button> {/* Word 저장 버튼 추가 */}
        </div>
      </div>
      <div className="documents">
        <div id="container" ref={wrapperRef}></div>
        <div className="assistant">
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
