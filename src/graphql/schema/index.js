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

  type Comment {
    id: ID!
    member: Member
    content: String!
    task: Task
    projectId: ID
    likeCount: Int
    isClicked: Boolean
    createdAt: String
    updatedAt: String
    expiredAt: String
  }

  type Like {
    id: ID!
    comment: Comment
    member: Member
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

    # Comment Queries
    getComments: [Comment]
    getCommentById(id: ID!): Comment
    getCommentsByTask(taskId: ID!): [Comment]
    getCommentsByProject(projectId: ID!): [Comment]

    # Like Queries
    getLikes: [Like]
    getLikesByComment(commentId: ID!): [Like]
  }

  type CreateMemberResponse {
    member: Member
    role: Role
    message: String
  }

  type ResponseMessage {
    message: String
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

    createMemberFromProject(
      projectId: ID!
      email: String!
      name: String
      permissions: [String]
    ): CreateMemberResponse
    removeMemberFromProject(projectId: ID!, memberId: ID!): ResponseMessage

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

    """
    특정 Task에 멤버를 추가합니다.
    """
    addMemberToTask(taskId: ID!, memberId: ID!): Task

    """
    특정 Task에서 멤버를 제거합니다.
    """
    removeMemberFromTask(taskId: ID!, memberId: ID!): Task

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

    # Comment Mutations
    createComment(content: String!, taskId: ID, projectId: ID): Comment
    updateComment(id: ID!, content: String!): Comment
    deleteComment(id: ID!): Comment

    # Like Mutations
    createLike(commentId: ID!): Like
    deleteLike(commentId: ID!): Like
  }
`;

export default typeDefs;
