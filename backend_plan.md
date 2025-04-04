# Plan: Implement Custom Node.js Backend (NestJS)

## Overview

This plan outlines the steps to implement a custom Node.js backend using NestJS, MongoDB, and JWT for authentication.

## Steps

1.  **Backend Setup (NestJS):** Set up the NestJS project and configure the MongoDB connection.
2.  **Data Module:** Create the `data` module and define the Mongoose schemas and the `DataService`.
    - Define Mongoose schemas for each data model (`collections`, `profiles`, `prompt_tags`, `prompt_versions`, `prompts`, `tags`).
    - Create a `DataService` to handle data access logic.
      - Implement methods for CRUD operations for each data model.
3.  **Authentication Module:** Create the `auth` module and implement user registration, login, and JWT authentication.
4.  **API Endpoints:** Create controllers for each data model.
    - Implement API endpoints for CRUD operations.
    - Implement authentication middleware to protect API endpoints.
5.  **Frontend Integration:** Update the frontend to use the new API endpoints and authentication flow.

## Diagrams

### Backend Architecture

```mermaid
graph TD
    A[Frontend] --> B{API Endpoints};
    B --> C[NestJS Backend];
    C --> D[Data Module];
    C --> E[Auth Module];
    D --> F[MongoDB];
    F --> G[Collections Schema];
    F --> H[Profiles Schema];
    F --> I[PromptTags Schema];
    F --> J[PromptVersions Schema];
    F --> K[Prompts Schema];
    F --> L[Tags Schema];
    E --> M[JWT Authentication];
    B --> N[Controllers];
    N --> O[CRUD Operations];
    O --> D;
    A --> P[Authentication Flow];
    P --> E;
```

### Data Service

```mermaid
graph TD
    A[DataService] --> B{CRUD Operations};
    B --> C[Collections];
    B --> D[Profiles];
    B --> E[PromptTags];
    B --> F[PromptVersions];
    B --> G[Prompts];
    B --> H[Tags];
    C --> I[Create Collection];
    C --> J[Read Collection];
    C --> K[Update Collection];
    C --> L[Delete Collection];
    D --> M[Create Profile];
    D --> N[Read Profile];
    D --> O[Update Profile];
    D --> P[Delete Profile];
    E --> Q[Create PromptTag];
    E --> R[Read PromptTag];
    E --> S[Update PromptTag];
    E --> T[Delete PromptTag];
    G --> U[Create Prompt];
    G --> V[Read Prompt];
    G --> W[Update Prompt];
    G --> X[Delete Prompt];
    H --> Y[Create Tag];
    H --> Z[Read Tag];
    H --> AA[Update Tag];
    H --> BB[Delete Tag];
```
