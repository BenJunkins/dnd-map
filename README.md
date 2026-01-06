# Faerun Monster Atlas

![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=flat-square)
![Build](https://img.shields.io/badge/Build-Passing-success?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)

**A Serverless React Application mapping D&D 5e data onto the world of Faerun.**

> **Status: Functional Prototype / Active Development**
>
> This application is currently live and functional, but features are being actively refined.

### [**Live Demo** (Click Here to View)](https://main.d66jhbb90risp.amplifyapp.com/)

---

## Overview

**Faerun Atlas** is an interactive data visualization tool that bridges the gap between raw D&D 5e API data and the geographical lore of the Forgotten Realms.

Users can explore a map of Faerun, hover over distinct regions (like the Sword Coast or Chult), and instantly see which monsters inhabit those areas based on their Challenge Rating (CR) and type.

### Key Features

- **Interactive Map:** Custom Leaflet.js implementation using a non-geographical (fantasy) coordinate system.
- **Region Detection:** Ray-casting algorithms determine which fantasy nation the cursor is hovering over.
- **Live Data:** Fetches monster statistics (HP, CR, Type) from a DynamoDB database.
- **Smart Filtering:** Filter monsters globally by Challenge Rating (Low, Mid, High).

---

## Architecture & Tech Stack

This project leverages a **Serverless Architecture** on AWS to ensure scalability, zero idle costs, and separation of concerns between data ingestion and presentation.

```mermaid
graph TD
    %% Nodes
    User([👤 User / Browser])
    Amplify[AWS Amplify<br/>(Hosting & CI/CD)]
    APIGW[AWS API Gateway<br/>(REST API)]
    
    subgraph Backend [Serverless Backend]
        ReqLambda[Lambda Function<br/>(Request Handler)]
        IngestLambda[Lambda Function<br/>(Data Ingestion)]
        DDB[(Amazon DynamoDB<br/>Monster Data)]
    end
    
    ExternalAPI[🌍 D&D 5e API<br/>(Source Data)]

    %% Data Flow Connections
    User -- "1. Loads App" --> Amplify
    User -- "2. Fetches Monsters" --> APIGW
    APIGW -- "Routes Request" --> ReqLambda
    ReqLambda -- "3. Queries Data" --> DDB
    DDB -.-> ReqLambda
    ReqLambda -.-> APIGW
    APIGW -.-> User

    %% Ingestion Flow (Offline/Admin)
    IngestLambda -- "Periodic Fetch" --> ExternalAPI
    ExternalAPI -- "Raw JSON" --> IngestLambda
    IngestLambda -- "Writes Optimized Data" --> DDB

    %% Styling
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:white;
    classDef ext fill:#85C1E9,stroke:#232F3E,stroke-width:2px,color:black;
    classDef user fill:#2ECC71,stroke:#232F3E,stroke-width:2px,color:white;

    class Amplify,APIGW,ReqLambda,IngestLambda,DDB aws;
    class ExternalAPI ext;
    class User user;
```

### Data Flow

1.  **Ingestion:** A Python Lambda script queries the [DnD 5e GraphQL API](https://www.dnd5eapi.co/) and writes optimized records to **DynamoDB**.
2.  **Request:** The React frontend requests data via **API Gateway**.
3.  **Response:** A second Lambda function scans the database and returns JSON to the client.
4.  **Visualization:** React maps the data points to custom polygons drawn over the Faerun image.

---

## How to Run Locally

If you want to poke around the code, you can run it on your machine:

1.  **Clone the repo**

    ```bash
    git clone [https://github.com/Ben_Junkins/dnd-map.git](https://github.com/Ben_Junkins/dnd-map.git)
    cd dnd-map
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Start the server**
    ```bash
    npm run dev
    ```

---

## Roadmap (Upcoming Features)

- [ ] **Accurate Spawning:** Move from random regional assignment to lore-accurate monster locations.
- [ ] **Detail View:** Click a monster to view full stats (AC, Speed, Attacks) in a modal.
- [ ] **Dungeon Master Mode:** Allow users to drag-and-drop monsters to build custom encounters.

---

## Legal Disclaimer

**Faerun Monster Explorer** is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.

The monster data is provided via the [DnD 5e API](https://www.dnd5eapi.co/) under the Creative Commons (CC-BY-4.0) license.

---

## Contact

Built by **Benjamin Junkins** as a Cloud & Frontend Portfolio Project.

- [LinkedIn](https://linkedin.com/in/benjamin-junkins/)
