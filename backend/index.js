// index.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketEvent = require('./socket/events');
const bodyParser = require('body-parser');
const Document = require('./models/document');
const documentsRoutes = require('./routes/documents'); // 문서 관련 라우트 파일

// Express 앱 설정
const app = express();
app.use(cors({ origin: "*" })); // 모든 출처 허용
app.use(express.json()); // JSON 파싱
app.use(bodyParser.json()); // request body 파싱

// 서버 설정 및 WebSocket 연결
const server = http.createServer(app);
const PORT = 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// WebSocket 이벤트 초기화
socketEvent.init(server);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Hello World');
});

// MongoDB 연결
mongoose.connect(
  "mongodb+srv://Capstone:caps0123@capstonedb.oqpu0.mongodb.net/?retryWrites=true&w=majority&appName=CapstoneDb",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  }
)
  .then(() => console.log('DB Connected...'))
  .catch((err) => console.error('DB Connection Failed:', err));

// 문서 관련 라우트 사용
app.use('/documents', documentsRoutes);

// roomId에 해당하는 문서 목록 가져오기
router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;

  try {
    const documents = await Document.find({ roomId });
    if (!documents || documents.length === 0) {
      return res.status(404).json({ message: 'No documents found for this room.' });
    }
    res.status(200).json({ documents });
  } catch (error) {
    console.error("Error fetching documents", error);
    res.status(500).json({ message: 'Error fetching documents', error });
  }
});

// 단일 roomId에 해당하는 문서 가져오기
router.get('/document/:roomId', async (req, res) => {
  const { roomId } = req.params;

  try {
    const document = await Document.findOne({ roomId });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(200).json({ document });
  } catch (error) {
    console.error("Error fetching document", error);
    res.status(500).json({ message: 'Error fetching document', error });
  }
});

module.exports = app;
