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

    const userEmail = (req.header('x-user-email') || '').trim();
    let connectUser = undefined;
    if (userEmail) {
        try {
            const user = await prisma.user.upsert({
                where: { email: userEmail },
                create: { email: userEmail },
                update: {},
            });
            connectUser = { connect: { id: user.id } };
        } catch (e) {
            console.warn('Failed to upsert user for email', userEmail, e);
        }
    }

    try {
        const project = await prisma.project.create({
            data: {
                name,
                gitUrl,
                subDomain: generateSlug(),
                ...(connectUser ? { user: connectUser } : {})
            }
        });

        return res.status(201).json({ data: project });
    } catch (e) {
        if (e.code === 'P2002' && e.meta?.target?.includes('name')) {
            return res.status(400).json({ error: 'Project name already exists. Please choose a different name.' });
        }
        console.error('Error creating project:', e);
        return res.status(500).json({ error: 'Failed to create project' });
    }
})

// List projects (no user filter yet; future: attach user and filter by user)
app.get('/projects', async (req, res) => {
    try {
        const userEmail = (req.header('x-user-email') || '').trim();
        let where = undefined;
        if (userEmail) {
            const user = await prisma.user.findUnique({ where: { email: userEmail } });
            if (!user) return res.json({ data: [] });
            where = { userId: user.id };
        }
        const projects = await prisma.project.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                Deployment: {
                    orderBy: { createdAt: 'desc' },
                }
            }
        });
        res.json({ data: projects });
    } catch (e) {
        console.error('Error fetching projects', e);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Project detail
app.get('/project/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = (req.header('x-user-email') || '').trim();
        let project = await prisma.project.findUnique({
            where: { id },
            include: {
                Deployment: {
                    orderBy: { createdAt: 'desc' },
                }
            }
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (userEmail) {
            const user = await prisma.user.findUnique({ where: { email: userEmail } });
            if (!user) return res.status(404).json({ error: 'Project not found' });
            // Backfill ownership for legacy projects with no userId
            if (!project.userId) {
                try {
                    project = await prisma.project.update({
                        where: { id: project.id },
                        data: { user: { connect: { id: user.id } } },
                        include: { Deployment: { orderBy: { createdAt: 'desc' } } }
                    });
                } catch (e) {
                    console.warn('Failed to backfill project owner', e);
                }
            }
            if (project.userId !== user.id) {
                return res.status(404).json({ error: 'Project not found' });
            }
        }
        res.json({ data: project });
    } catch (e) {
        console.error('Error fetching project', e);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});



app.post('/deploy', async (req, res) => {
    const { projectId } = req.body; // you forgot this!

    const userEmail = (req.header('x-user-email') || '').trim();
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    if (userEmail) {
        const user = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!user || project.userId !== user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
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

        // Update deployment status to IN_PROGRESS since ECS task started
        const updatedDeployment = await prisma.deployment.update({
            where: { id: createdDeployment.id },
            data: { status: 'IN_PROGRESS' }
        });
        console.log(`Deployment ${createdDeployment.id} status updated to IN_PROGRESS:`, updatedDeployment);

        res.status(200).json({
            status: 'queued',
            data: {deploymentId: createdDeployment.id}
        });

    } catch (error) {
        console.error('Error starting ECS Task:', error);
        
        // Update deployment status to FAILED if ECS task failed to start
        try {
            const failedDeployment = await prisma.deployment.update({
                where: { id: createdDeployment.id },
                data: { status: 'FAILED' }
            });
            console.log(`Deployment ${createdDeployment.id} status updated to FAILED:`, failedDeployment);
        } catch (updateError) {
            console.error('Error updating deployment status to FAILED:', updateError);
        }
        await prisma.deployment.update({
            where: { id: createdDeployment.id },
            data: { status: 'FAILED' }
        });
        
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

// Update deployment status endpoint
app.patch('/deployment/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['NOT_STARTED', 'QUEUED', 'IN_PROGRESS', 'READY', 'FAILED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const deployment = await prisma.deployment.update({
      where: { id },
      data: { status },
    });

    console.log(`Manual status update: Deployment ${id} updated to ${status}`);
    res.json({ data: deployment });
  } catch (error) {
    console.error("Error updating deployment status:", error);
    res.status(500).json({ error: "Failed to update deployment status" });
  }
});

// Test endpoint to check deployment status
app.get('/deployment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deployment = await prisma.deployment.findUnique({
      where: { id }
    });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    res.json({ data: deployment });
  } catch (error) {
    console.error("Error fetching deployment:", error);
    res.status(500).json({ error: "Failed to fetch deployment" });
  }
});

// Cleanup stale deployments (deployments that are stuck in QUEUED or IN_PROGRESS for too long)
async function cleanupStaleDeployments() {
  try {
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    
    const staleDeployments = await prisma.deployment.updateMany({
      where: {
        status: {
          in: ['QUEUED', 'IN_PROGRESS']
        },
        createdAt: {
          lt: staleThreshold
        }
      },
      data: {
        status: 'FAILED'
      }
    });

    if (staleDeployments.count > 0) {
      console.log(`Cleaned up ${staleDeployments.count} stale deployments`);
    }
  } catch (error) {
    console.error('Error cleaning up stale deployments:', error);
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupStaleDeployments, 10 * 60 * 1000);

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
    try {
        await consumer.connect();
        console.log('Kafka consumer connected successfully');
        
        await consumer.subscribe({ topic: process.env.KAFKA_TOPIC, fromBeginning: true });
        console.log(`Subscribed to Kafka topic: ${process.env.KAFKA_TOPIC}`);
        
        await consumer.run({
            autoCommit: false,
            eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {
                const messages = batch.messages;
                console.log(`Received ${messages.length} messages in batch from topic ${batch.topic}`);
                for (let message of messages) {
                    const messageValue = message.value.toString();
                    console.log('Processing Kafka message:', messageValue);
                    
                    try {
                        const { PROJECT_ID, DEPLOYMENT_ID, log, metadata = {} } = JSON.parse(messageValue);
                        
                        // Insert log into ClickHouse
                        const { query_id } = await client.insert({
                            table: 'log_events',
                            values: [{
                                event_id: uuidV4(),
                                deployment_id: DEPLOYMENT_ID,
                                log,
                                metadata:{PROJECT_ID, DEPLOYMENT_ID, ...metadata}
                            }],
                            format: 'JSONEachRow'
                        });

                        // Check for deployment start
                        if (log && log.includes("Build started......")) {
                            try {
                                const startedDeployment = await prisma.deployment.update({
                                    where: { id: DEPLOYMENT_ID },
                                    data: { status: 'IN_PROGRESS' }
                                });
                                console.log(`🚀 Deployment ${DEPLOYMENT_ID} marked as IN_PROGRESS:`, startedDeployment);
                            } catch (e) {
                                console.error('❌ Error updating deployment status to IN_PROGRESS:', e);
                            }
                        }

                        // Check for deployment completion and update status
                        if (log && (
                            log.includes("All files uploaded successfully. Build process complete.") ||
                            log.includes("== All files uploaded successfully ==")
                        )) {
                            try {
                                const completedDeployment = await prisma.deployment.update({
                                    where: { id: DEPLOYMENT_ID },
                                    data: { status: 'READY' }
                                });
                                console.log(`🎉 Deployment ${DEPLOYMENT_ID} marked as READY:`, completedDeployment);
                            } catch (e) {
                                console.error('❌ Error updating deployment status to READY:', e);
                            }
                        }

                        // Check for deployment failure
                        if (log && (log.includes("Build failed") || log.includes("Error:") || log.includes("FAILED"))) {
                            try {
                                const failedDeployment = await prisma.deployment.update({
                                    where: { id: DEPLOYMENT_ID },
                                    data: { status: 'FAILED' }
                                });
                                console.log(`💥 Deployment ${DEPLOYMENT_ID} marked as FAILED:`, failedDeployment);
                            } catch (e) {
                                console.error('❌ Error updating deployment status to FAILED:', e);
                            }
                        }
                        
                    } catch (parseError) {
                        console.error('❌ Error parsing Kafka message:', parseError);
                        console.error('❌ Message value:', messageValue);
                    }

                    resolveOffset(message.offset)
                    await commitOffsetsIfNecessary(message.offset)
                    await heartbeat()
                }
            }
        });
    } catch (error) {
        console.error('Error initializing Kafka consumer:', error);
    }
}

initKafkaConsumer()

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.listen(PORT, () => {
    console.log(`API Server is running on port ${PORT}`);
});