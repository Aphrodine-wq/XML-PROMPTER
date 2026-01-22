# Technical Architecture Document
## XML Website Prompt Generator

**Version:** 1.0
**Date:** January 21, 2026

---

## 1. System Overview

The **XML Website Prompt Generator** is a hybrid application comprising an Electron-based Desktop GUI and a Node.js-based CLI tool. Both interfaces share a common core library (`@xmlpg/core`) that handles business logic, AI interaction, and data persistence.

### 1.1 High-Level Architecture

```mermaid
graph TD
    UserGUI[User (GUI)] --> ElectronRenderer
    UserCLI[User (CLI)] --> CLITool
    
    subgraph "Frontend Layer"
        ElectronRenderer[Electron Renderer (React)]
        CLITool[CLI Interface (Commander.js)]
    end
    
    subgraph "Application Layer"
        ElectronMain[Electron Main Process]
        SharedCore[Shared Core Library (@xmlpg/core)]
    end
    
    subgraph "Infrastructure Layer"
        OllamaService[Ollama Service]
        FileSystem[File System]
        SQLiteDB[(SQLite Database)]
    end
    
    ElectronRenderer -- IPC --> ElectronMain
    ElectronMain --> SharedCore
    CLITool --> SharedCore
    
    SharedCore --> OllamaService
    SharedCore --> FileSystem
    SharedCore --> SQLiteDB
```

---

## 2. Component Design

### 2.1 Shared Core Library (`@xmlpg/core`)

This is the heart of the application, designed to be environment-agnostic (Node.js).

**Modules:**
- **PromptEngine**: Handles prompt generation logic, context assembly, and XML validation.
- **AIProvider**: Abstract interface for AI providers.
  - `OllamaProvider`: Concrete implementation for Ollama API.
- **DataManager**: Manages persistence.
  - `TemplateManager`: CRUD for file-based templates.
  - `HistoryManager`: SQLite interactions for prompt history.
- **ConfigManager**: Handles user settings and environment validation.

**Key Interfaces:**
```typescript
interface AIProvider {
  listModels(): Promise<Model[]>;
  generate(prompt: string, options: GenerationOptions): AsyncGenerator<string>;
  pullModel(modelName: string): AsyncGenerator<Progress>;
}

interface PromptResult {
  id: string;
  prompt: string;
  response: string;
  model: string;
  timestamp: number;
  metadata: Record<string, any>;
}
```

### 2.2 Electron Application

**Main Process:**
- Initializes the `SharedCore`.
- Exposes core functionality to Renderer via `ipcMain`.
- Manages window lifecycle and native menus.

**Renderer Process:**
- **Tech Stack**: React, Tailwind CSS, Zustand, Monaco Editor.
- **Communication**: Uses `window.electronAPI` (Context Bridge) to call Main Process.
- **State Management**:
  - `useEditorStore`: Manages current prompt text, validation state.
  - `useSettingsStore`: Manages model selection, theme.

### 2.3 CLI Tool

**Tech Stack**: Commander.js, Ink (optional, for rich terminal UI), Chalk.

**Commands:**
- `generate <prompt>`: Generates XML output.
- `models list`: Lists available local models.
- `models pull <name>`: Downloads a model.
- `history`: View recent generations.

---

## 3. Data Design

### 3.1 Database Schema (SQLite)

**Table: `history`**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| prompt_text | TEXT | The natural language input |
| xml_output | TEXT | The generated XML |
| model_id | TEXT | Name of the model used |
| created_at | DATETIME | Timestamp |
| duration_ms | INTEGER | Generation time in ms |
| is_favorite | BOOLEAN | User flag |

**Table: `templates`** (Metadata only, content in FS)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| name | TEXT | Display name |
| path | TEXT | Relative path to file |
| category | TEXT | Grouping category |
| tags | TEXT | JSON array of tags |

### 3.2 File Structure

```
~/Documents/XMLPromptGenerator/
├── config.json          # User preferences
├── templates/           # User-created templates
│   ├── basic-landing.xml
│   └── blog-post.xml
└── database/
    └── app.sqlite       # History DB
```

---

## 4. Implementation Strategy

### 4.1 Monorepo Structure (Recommended)

To efficiently share code between CLI and Electron, we will use a monorepo structure (e.g., using pnpm workspaces or simple directory separation if standard npm).

```
/
├── packages/
│   ├── core/           # Shared business logic
│   ├── cli/            # CLI tool
│   └── app/            # Electron desktop app
├── package.json
└── tsconfig.json
```

### 4.2 AI Integration

- **Client**: We will use `axios` for raw HTTP requests to Ollama or the official `ollama-js` library if suitable.
- **Streaming**: Implementation must support streaming responses (Server-Sent Events or raw stream) to provide real-time feedback in both GUI and CLI.

### 4.3 XML Handling

- **Validation**: `fast-xml-parser` will be used to validate structure.
- **Schema**: Custom XSD validation logic will be implemented in `PromptEngine` to ensure outputs match expected "Website Prompt" formats.

---

## 5. Security Considerations

- **IPC Security**: Context Isolation enabled. No Node.js integration in Renderer.
- **Input Validation**: All user inputs (CLI args and GUI text) sanitized via Zod schemas.
- **Local Sandbox**: The app operates strictly within the user's home directory structure defined in config.

---

## 6. Future Proofing

- **Provider Agnostic**: The `AIProvider` interface allows swapping Ollama for LM Studio or a direct generic OpenAI-compatible endpoint in the future without changing UI logic.
- **Plugin System**: The `SharedCore` is designed to be extensible, allowing future plugins to hook into `PromptEngine` pipelines.
