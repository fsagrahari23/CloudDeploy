process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", err => {
    console.error("UNHANDLED REJECTION:", err);
});

const dotenv = require('dotenv');

const express = require('express');
const app = express();
const { generateSlug } = require('random-word-slugs')
const path = require('path');

// Load shared env first
dotenv.config({ path: path.resolve(__dirname, '../.env.common') });

// Load service-specific env second (it overrides shared vars if duplicate)
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');

const PORT = 5500;
const { Server } = require("socket.io");
const cors = require('cors');
const { z } = require("zod");
const { v4: uuidV4 } = require('uuid')
const { createClient } = require('@clickhouse/client');
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

const fs = require("fs");
const { PrismaClient } = require('./generated/prisma/client');



const prisma = new PrismaClient();
const {Kafka} = require('kafkajs');

const kafka = new Kafka({
    clientId: `api-server`,
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

const consumer = kafka.consumer({ groupId: 'api-server-logs-consumer' });

const client = createClient({
    url: process.env.CLICKHOUSE_URL,
    database: process.env.CLICKHOUSE_DB,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
});

const io = new Server({
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    socket.on('subscribe', (channel) => {
        console.log(channel);
        console.log(`Client ${socket.id} subscribed to project:`);
        socket.join(channel);
        socket.emit('subscribed', `Subscribed to project: ${channel}`);
    });
});


io.listen(5001, () => {
    console.log("Socket.io server running on port 6000");
});

app.use(express.json());

const ecsClient = new ECSClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_BUCKET_REGION,
});

const config = {
    CLUSTER: process.env.AWS_ROLE_ARN,
    TASK: process.env.AWS_ECS_TASK_DEFINITION,
}

app.post('/project', async (req, res) => {
    const schema = z.object({
        name: z.string().min(3),
        gitUrl: z.string()
    });
    const savePraseResult = schema.safeParse(req.body);
    if (!savePraseResult.success) {
        return res.status(400).json({ error: savePraseResult.error.errors });
    }
    const { name, gitUrl } = savePraseResult.data;

    const project = await prisma.project.create({
        data: {
            name,
            gitUrl,
            subDomain: generateSlug()
        }
    });

    return res.status(201).json({ data: project });
})



app.post('/deploy', async (req, res) => {
    const { projectId } = req.body; // you forgot this!

    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    // check if there is not running deployment for the same project
    const deployment = await prisma.deployment.findFirst({
        where: {
            projectId: project.id,
            status: 'IN_PROGRESS'
        }
    });

    if (deployment) {
        return res.status(400).json({ error: 'There is already a running deployment for this project' });
    }

    const gitUrl = project.gitUrl;
    const projectSlug = project.subDomain;

    const createdDeployment = await prisma.deployment.create({
        data: {
            project: { connect: { id: project.id } },
            status: 'QUEUED'
        }
    });



    console.log('Received build request for Git URL:', gitUrl);


    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [process.env.SUBNET_1, process.env.SUBNET_2, process.env.SUBNET_2],
                securityGroups: [process.env.AWS_SECURITY_GROUP_ID]
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image3',
                    environment: [
                        { name: 'GIT_REPOSITORY_URL', value: project.gitUrl },
                        { name: 'PROJECT_ID', value: projectSlug },
                        { name: 'DEPLOYMENT_ID', value: createdDeployment.id },
                    ],
                },
            ],
        },
    });

    console.log('Starting ECS Task with parameters:', {
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
    })

    try {
        const data = await ecsClient.send(command);
        console.log('ECS Task started successfully:', data);

        res.status(200).json({
            status: 'queued',
            data: {deploymentId: createdDeployment.id}
        });

    } catch (error) {
        console.error('Error starting ECS Task:', error);
        res.status(500).json({ error: 'Failed to start build' });
    }
});


app.get('/get-logs/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;

    const resultSet = await client.query({
      query: `
        SELECT log, timestamp
        FROM log_events
        WHERE deployment_id = {deployment_id:String}
        ORDER BY event_id ASC
      `,
      query_params: {
        deployment_id: deploymentId,
      },
      format: 'JSONEachRow',
    });

    const logs = await resultSet.json(); // or resultSet.text() if your client requires

    res.status(200).json({ data: logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// // spin the container 
// function initRedisSubscriber() {
//     subscriber.psubscribe(`logs:*`, (err, count) => {
//         if (err) {
//             console.error('Failed to subscribe: ', err);
//         } else {
//             console.log(`Subscribed successfully! This client is currently subscribed to ${count} channels.`);
//         }
//     });

//     subscriber.on('pmessage', (pattern, channel, message) => {
//         console.log(`Received message from ${channel}: ${message}`);
//         io.to(channel).emit('log', message);
//     });
// }

// initRedisSubscriber();

async function initKafkaConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topic: process.env.KAFKA_TOPIC, fromBeginning: true });
    await consumer.run({
        autoCommit: false,
        eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {
            const messages = batch.messages;
            console.log(`Received ${messages.length} messages in batch from topic ${batch.topic}`);
            for (let message of messages) {
                const messageValue = message.value.toString();
                const { PROJECT_ID, DEPLOYMENT_ID, log ,metadata} = JSON.parse(messageValue);
                const { query_id } = await client.insert({
                    table: 'log_events',
                    values: [{
                        event_id: uuidV4(),
                        deployment_id: DEPLOYMENT_ID,
                        log,
                        metadata:{PROJECT_ID, DEPLOYMENT_ID, ...metadata}
                    }],
                    format: 'JSONEachRow'

                })

                resolveOffset(message.offset)
                await commitOffsetsIfNecessary(message.offset)
                await heartbeat()

            }

        }
    })
}

initKafkaConsumer()

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.listen(PORT, () => {
    console.log(`API Server is running on port ${PORT}`);
});