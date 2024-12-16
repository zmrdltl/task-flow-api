# task-flow-api

프로젝트 관리 웹 사이트 API \
[fronted](https://github.com/kimuihyeon222/task-flow)

## Prerequisite

To run this project, make sure you have the following installed:

- **Node.js**: >=18.0.0
- **npm**: >=10.5.0
- **MongoDB**: >=6.0.x
- **Mongosh**: 2.3.5
- **GraphQL**: 16.9.0

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/zmrdltl/task-flow-api
cd task-flow-api
```

### 2. Install dependencies

```bash
npm i
```

### 3. setup environment variables

- create .env file in task-flow-api/
- add following content

```bash
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/task-flow
```

### 4. start the development server
```bash
npm run dev
```

### 4. start the production server
```bash
npm start
```

## Project Structure

```plaintext
task-flow-api/
├── src/
│   ├── config/           # Environment configuration (e.g., database connection)
│   ├── graphql/          # GraphQL schema and resolvers
│   │   ├── schema/       # GraphQL type definitions
│   │   └── resolvers/    # GraphQL resolvers
│   ├── models/           # Mongoose models
│   └── index.js          # Entry point of the application
├── .env                  # Environment variables (ignored in Git)
├── package.json          # Project dependencies and scripts
└── README.md             # Project documentation
```

## API attemptation

[localhost graphql](http://localhost:4000/graphql)

![Example image](https://gist.github.com/user-attachments/assets/4c0507d6-5956-4978-8c59-0d221d4b9438)

## Data visualization

[localhost voyager](http://localhost:4000/voyager)

![Example image](https://gist.github.com/user-attachments/assets/0c285ab6-68b4-480d-9819-a81dec1ba722)