const express = require('express');
const router = express.Router();
const Document = require('../models/document'); // Document 모델

// 문서 생성
router.post('/', async (req, res) => {
    const { title, content, owner, roomId } = req.body;

    try {
        const newDocument = new Document({ title, content, owner, roomId });
        await newDocument.save();
        res.status(201).json({ document: newDocument });
    } catch (error) {
        console.error("Error creating document", error);
        res.status(500).json({ message: 'Error creating document', error });
    }
});

// 문서 조회 (roomId로)
router.get('/:roomId', async (req, res) => {
    const { roomId } = req.params;

    try {
        const documents = await Document.find({ roomId });
        if (!documents.length) {
            return res.status(404).json({ message: 'No documents found' });
        }
        res.status(200).json({ documents });
    } catch (error) {
        console.error("Error fetching documents", error);
        res.status(500).json({ message: 'Error fetching documents', error });
    }
});

// 단일 문서 조회
router.get('/document/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.status(200).json({ document });
    } catch (error) {
        console.error("Error fetching document", error);
        res.status(500).json({ message: 'Error fetching document', error });
    }
});

// 문서 업데이트
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    try {
        const document = await Document.findByIdAndUpdate(id, { title, content, updatedAt: Date.now() }, { new: true });
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.status(200).json({ document });
    } catch (error) {
        console.error("Error updating document", error);
        res.status(500).json({ message: 'Error updating document', error });
    }
});

// 문서 삭제
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const document = await Document.findByIdAndDelete(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error("Error deleting document", error);
        res.status(500).json({ message: 'Error deleting document', error });
    }
});

module.exports = router;
