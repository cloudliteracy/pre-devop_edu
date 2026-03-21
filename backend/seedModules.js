require('dotenv').config();
const mongoose = require('mongoose');
const Module = require('./models/Module');

const modules = [
  {
    title: "Introduction to Pre-DevOps",
    description: "Learn the fundamentals of DevOps culture, practices, and tools",
    price: 49,
    currency: "USD",
    order: 1,
    pdfs: [],
    videos: [],
    quiz: {
      questions: [
        {
          question: "What is DevOps?",
          options: ["A tool", "A culture and practice", "A programming language", "An operating system"],
          correctAnswer: 1
        },
        {
          question: "Which is a key principle of DevOps?",
          options: ["Waterfall development", "Continuous Integration", "Manual testing only", "Isolated teams"],
          correctAnswer: 1
        }
      ],
      passingScore: 70
    }
  },
  {
    title: "Version Control with Git",
    description: "Master Git and GitHub for version control and collaboration",
    price: 49,
    currency: "USD",
    order: 2,
    pdfs: [],
    videos: [],
    quiz: {
      questions: [
        {
          question: "What command creates a new Git repository?",
          options: ["git start", "git init", "git create", "git new"],
          correctAnswer: 1
        }
      ],
      passingScore: 70
    }
  },
  {
    title: "CI/CD Pipelines",
    description: "Build automated CI/CD pipelines with Jenkins and GitHub Actions",
    price: 69,
    currency: "USD",
    order: 3,
    pdfs: [],
    videos: [],
    quiz: { questions: [], passingScore: 70 }
  },
  {
    title: "Containerization with Docker",
    description: "Learn Docker fundamentals and container orchestration",
    price: 79,
    currency: "USD",
    order: 4,
    pdfs: [],
    videos: [],
    quiz: { questions: [], passingScore: 70 }
  },
  {
    title: "Kubernetes Essentials",
    description: "Deploy and manage applications with Kubernetes",
    price: 99,
    currency: "USD",
    order: 5,
    pdfs: [],
    videos: [],
    quiz: { questions: [], passingScore: 70 }
  },
  {
    title: "Infrastructure as Code",
    description: "Automate infrastructure with Terraform and Ansible",
    price: 89,
    currency: "USD",
    order: 6,
    pdfs: [],
    videos: [],
    quiz: { questions: [], passingScore: 70 }
  },
  {
    title: "Monitoring and Logging",
    description: "Implement monitoring with Prometheus, Grafana, and ELK Stack",
    price: 79,
    currency: "USD",
    order: 7,
    pdfs: [],
    videos: [],
    quiz: { questions: [], passingScore: 70 }
  }
];

async function seedModules() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Module.deleteMany({});
    console.log('Cleared existing modules');

    await Module.insertMany(modules);
    console.log('Seeded 7 modules successfully');

    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedModules();
