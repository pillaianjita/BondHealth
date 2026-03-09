// storage.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const uploadDirs = [
    './uploads',
    './uploads/reports',
    './uploads/scans',
    './uploads/temp'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let dest = './uploads/temp';
        if (file.fieldname === 'report') {
            dest = './uploads/reports';
        } else if (file.fieldname === 'scan') {
            dest = './uploads/scans';
        }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: fileFilter
});

class StorageService {
    async uploadFile(file, folder = 'reports') {
        return {
            url: `/uploads/${folder}/${path.basename(file.path)}`,
            filename: path.basename(file.path),
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        };
    }
}

module.exports = {
    upload,
    storageService: new StorageService()
};