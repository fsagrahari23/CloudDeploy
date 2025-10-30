const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, '../.env.common') });

// Load service-specific env second (it overrides shared vars if duplicate)
dotenv.config({ path: path.resolve(__dirname, '.env') });
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const { Kafka } = require('kafkajs')




const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_BUCKET_REGION,
});

const PROJECT_ID = process.env.PROJECT_ID;
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;

const kafka = new Kafka({
  clientId: `docker-build-server-${DEPLOYMENT_ID}`,
  brokers: [process.env.KAFKA_BROKER],
  ssl: {
    ca: [fs.readFileSync(path.join(__dirname, 'cakafka.pem'), 'utf-8')]
  },
  sasl: {
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
    mechanism: 'plain'
  }
});

const producer = kafka.producer();

async function publishLog(log) {
  await producer.send({
    topic: `container-logs`,
    messages: [
      { key: 'log', value: JSON.stringify({ PROJECT_ID, DEPLOYMENT_ID, log }) },
    ],
  });

}

// ---- Recursive walker ----
function walk(dir) {
  let files = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.lstatSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function init() {
  await producer.connect();
  console.log("== executing script.js ==");
  await publishLog('Build started......');

  //  read package.json and on that basis run build command

  const outDirPath = path.join(__dirname, "output");
  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", async (data) => {
    console.log(data.toString());
    await publishLog(data.toString());
  });
  p.stderr?.on("data", async (e) => {
    console.error("ERROR", e.toString())
    await publishLog(`ERROR: ${e.toString()}`);
  });


  p.on("close", async () => {
    console.log("== Build successful ==");
    await publishLog('Build successful. Starting upload to S3...');

    // ---- PATCH index.html paths HERE ----
    const indexPath = path.join(__dirname, "output", "dist", "index.html");
    if (fs.existsSync(indexPath)) {
      let html = fs.readFileSync(indexPath, "utf8");
      html = html.replace(/href="\//g, 'href="./');
      html = html.replace(/src="\//g, 'src="./');
      fs.writeFileSync(indexPath, html, "utf8");
      console.log("== Patched /assets → ./assets in index.html ==");
    } else {
      console.warn("index.html not found for patching!");
    }

    // ---- UPLOAD FILES TO S3 ----
    await publishLog('Uploading files to S3...');

    const distPath = path.join(__dirname, "output", "dist");
    const files = walk(distPath);

    for (const fullPath of files) {
      const relative = path.relative(distPath, fullPath);
      publishLog(`Uploading: ${relative}`);

      const uploadCmd = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `__outputs/${PROJECT_ID}/${relative}`,
        Body: fs.createReadStream(fullPath),
        ContentType: mime.lookup(fullPath) || "application/octet-stream",
      });

      await s3.send(uploadCmd);
      await publishLog(`Uploaded: ${relative}`);
      console.log(`Uploaded: ${relative}`);
    }

    console.log("== All files uploaded successfully ==");
    await publishLog('All files uploaded successfully. Build process complete.');
    process.exit(0);
  });
}

init().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
