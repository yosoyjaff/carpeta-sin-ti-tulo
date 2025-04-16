const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const crypto = require('crypto');
require('dotenv').config();
const app = express();
const port = 3441;

const minioClient = new Minio.Client({
	endPoint: process.env.MINIO_ENDPOINT,
	port: parseInt(process.env.MINIO_PORT),
	useSSL: process.env.MINIO_SSL === 'true',
	accessKey: process.env.MINIO_ACCESS_KEY,
	secretKey: process.env.MINIO_SECRET_KEY,
});

const endPoint = process.env.MINIO_ENDPOINT;
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, 
	},
});
// Función para generar un nombre de archivo único
const generateUniqueFileName = (originalname) => {
	const timestamp = Date.now();
	const randomString = crypto.randomBytes(8).toString('hex');
	const extension = originalname.split('.').pop();
	return `${timestamp}-${randomString}.${extension}`;
};
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});
app.post('/api/catalogo/subirImagenCms', upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res
				.status(400)
				.json({ error: true, msg: 'No se ha proporcionado ningún archivo' });
		}

		const bucketName = 'imp-archivos';
		const originalName = req.file.originalname;
		const objectName = generateUniqueFileName(originalName);
		const fileBuffer = req.file.buffer;
		const tipo = req.body.tipo || 'default';

		let prefix = 'cms/images/';
		if (tipo === 'cms-slides') {
			prefix = 'cms/slides/';
		}
		const fullObjectName = prefix + objectName;

		const metaData = {
			'Content-Type': req.file.mimetype,
			'X-Tipo': tipo,
			'X-Original-Name': originalName,
		};

		await minioClient.putObject(bucketName, fullObjectName, fileBuffer, metaData);

		const fileUrl = `https://${endPoint}/${bucketName}/${fullObjectName}`;


        console.log(`✅ Archivo subido: ${fileUrl}`);
        
		return res.status(200).json({
			error: false,
			msg: 'Archivo subido exitosamente',
			data: {
				fileName: fullObjectName,
				fileUrl: fileUrl,
				tipo: tipo,
			},
		});
	} catch (error) {
		console.error('Error al subir el archivo:', error);
		return res.status(500).json({
			error: true,
			msg: 'Error al subir el archivo',
			errorDetails: error.message,
		});
	}
});
app.listen(port, () => {
	console.log(`API de carga de archivos MinIO escuchando en :::${port}`);
});
