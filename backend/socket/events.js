// events.js
// roomId를 docId로 사용
const { Server } = require("socket.io");
const docController = require("../controllers/documents");

const usersInRooms = {}; // 각 roomId에 대한 사용자 배열을 저장하는 객체

exports.init = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-room", async ({ userName, roomId }) => {
      console.log(`${userName} joined room ${roomId}`);

      // 방 목록에 사용자가 존재하는지 확인 후 추가
      if (!usersInRooms[roomId]) {
        usersInRooms[roomId] = [];
      }

      // 중복된 이름 방지
      if (!usersInRooms[roomId].includes(userName)) {
        usersInRooms[roomId].push(userName);
      }

      // 방에 있는 모든 사용자에게 사용자 목록 전달
      io.to(roomId).emit("update-user-list", usersInRooms[roomId]);

      // roomId를 documentId로 간주하여 문서 로드 또는 생성
      const document = await docController.getDocumentByRoomId(roomId);
      if (!document) {
        await docController.createDocument(roomId);
      }

      socket.join(roomId);
      console.log(`User ${userName} has joined room: ${roomId}`);
      socket.emit("load-document", document?.data);

      // 방에 있는 모든 사용자에게 사용자 목록 전달
      io.to(roomId).emit("update-user-list", usersInRooms[roomId]);

      // 연결 해제 시 사용자 제거 처리
      socket.on("disconnect", () => {
        usersInRooms[roomId] = usersInRooms[roomId].filter((name) => name !== userName);
        io.to(roomId).emit("update-user-list", usersInRooms[roomId]);
        console.log(`${userName} left room ${roomId}`);
      });
    });

    // 클라이언트에서 발생하는 문서 수정 사항 전송
    socket.on("send-changes", async (delta) => {
      const roomId = Array.from(socket.rooms)[1]; // 소켓이 가입된 방 중 실제 roomId 가져오기
      if (roomId) {
        console.log(`Sending changes to room ${roomId}`);
        socket.broadcast.to(roomId).emit("receive-changes", delta);
      }
    });

    // 문서 저장
    socket.on("save-changes", async (data) => {
      const roomId = Array.from(socket.rooms)[1]; // 소켓이 가입된 방 중 실제 roomId 가져오기
      if (roomId) {
        console.log(`Saving changes for room ${roomId}`);
        await docController.updateDocument(roomId, data);
        socket.broadcast.to(roomId).emit("send-changes", data);
      }
    });

    // 문서 제목 업데이트
    socket.on("update-title", async ({ roomId, newTitle }) => {
      if (roomId) {
        console.log(`Updating title for room ${roomId} : ${newTitle}`);
        await docController.updateTitle(roomId, newTitle);
        io.to(roomId).emit("title-updated", newTitle);
      }
    });
  });
};
