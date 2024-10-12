import "./Dashboard.css"
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api"

function Dashboard() {
  const navigate = useNavigate();
  let { roomId } = useParams(); // URL에서 roomName을 받아옴
  const [documents, setDocuments] = useState([]);

  roomId = 12345;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/documents/${roomId}`, {
          // params: {
          //   userId: user.id,
          // },
        });
        setDocuments(response.data.documents);
        console.log(response.data.documents)
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [roomId]);

  const handleCreateNewDocument = async () => {
    try {
      // 필요한 필수 값을 준비 (title, owner, roomId)
      const title = "New Document";  // 문서 제목 (기본 값)
      const owner = sessionStorage.getItem('userId');  // 사용자 ID (예시로 MongoDB ObjectId)
      const roomId = "12345";  // 현재 방의 ID

      // POST 요청으로 서버에 새 문서 생성
      const res = await api.post("/documents", { title, owner, roomId });
      console.log(res.data.document);

      // 새로 생성된 문서의 ID로 페이지 이동
      navigate(`/documents/${res.data.document._id}`);
    } catch (error) {
      console.log("Error creating document:", error);
    }
  };


  return (
    <div className="dashboard">
      <h1>Dashboard for {roomId}</h1>
      <button onClick={handleCreateNewDocument}>Create New Document</button>
      <ul>
        {documents.map((document) => (
          <li key={document.id}>
            <a href={`/documents/${document._id}`}>{document.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
