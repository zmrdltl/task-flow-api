import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type AuthPayload {
    accessToken: String!
    member: Member!
  }

  type Member {
    id: ID!
    googleId: String
    projectId: ID!
    email: String!
    nickname: String!
    profileImage: String!
    isActive: Boolean!
    role: Role
  }

  type Task {
    id: ID!
    projectId: ID!
    name: String!
    description: String
    status: String!
    managers: [Member]
    startDate: String
    endDate: String
    progress: Int
    subTasks: [Task]
    priority: Boolean
  }

  type CreateRoleResponse {
    member: Member!
    role: Role!
  }

  type Role {
    id: ID!
    name: String!
    permissions: [String]
    projectId: ID!
    memberId: ID!
  }

  type SubTaskResponse {
    id: ID!
    name: String!
    description: String
    status: String!
    priority: Boolean
    progress: Int
    managers: [Member]
    subTasks: [Task]
  }

  type Project {
    id: ID!
    name: String!
    description: String
    progress: Int
    members: [Member]
    endDate: String
    tasks: [Task]
    createdAt: String
    updatedAt: String
  }

  input TaskInput {
    name: String!
    description: String
    status: String!
    managers: [ID]
    startDate: String
    endDate: String
    progress: Int
    priority: Boolean
  }

  type Query {
    # Member Queries
    getMembers: [Member]
    getMemberById(id: ID!): Member
    getMembersByProject(projectId: ID!): [Member]
    getMembersByEmail(email: String!): [Member]

    # Project Queries
    getProjects: [Project]
    getProjectById(id: ID!): Project

    # Task Queries
    getTasks: [Task]
    getTaskById(id: ID!): Task

    # Role Queries
    getRoles: [Role]
    getRoleById(id: ID!): Role
    getRolesByProjectId(projectId: ID!): [Role]
  }

  type Mutation {
    googleLogin(accessToken: String!): AuthPayload

    # Member Mutations
    createMember(
      email: String!
      nickname: String!
      isActive: Boolean
      projectId: ID!
    ): Member
    updateMember(
      id: ID!
      email: String
      nickname: String
      isActive: Boolean
    ): Member
    deleteMember(id: ID!): Member

    # Project Mutations
    createProject(
      name: String!
      description: String
      members: [ID]
      endDate: String
    ): Project
    updateProject(
      id: ID!
      name: String
      description: String
      members: [ID]
      endDate: String
    ): Project
    deleteProject(id: ID!): Project

    # Task Mutations
    createTask(
      projectId: ID!
      name: String!
      description: String
      status: String!
      managers: [ID]
      startDate: String
      endDate: String
      progress: Int
      priority: Boolean
    ): Task

    updateTask(
      id: ID!
      name: String
      description: String
      status: String
      managers: [ID]
      startDate: String
      endDate: String
      progress: Int
      priority: Boolean
    ): Task

    deleteTask(id: ID!): Task

    createSubTask(parentTaskId: ID!, task: TaskInput!): SubTaskResponse
    deleteSubTask(parentTaskId: ID!, subTaskId: ID!): Task

    # Role Mutations
    createRole(
      name: String!
      permissions: [String]
      projectId: ID!
      memberId: ID!
    ): Role
    createRoleByMemberEmail(
      email: String!
      projectId: ID!
      name: String!
      permissions: [String]
    ): CreateRoleResponse!
    updateRole(
      id: ID!
      name: String
      permissions: [String]
      projectId: ID!
      memberId: ID!
    ): Role
    deleteRole(id: ID!): Role
  }
`;

export default typeDefs;
