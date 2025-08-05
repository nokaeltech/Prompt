# Hierarchical Task System

## Overview

The hierarchical task system provides a structured way to manage tasks extracted from AI responses. Instead of creating multiple independent tasks from a single AI response, this system creates:

1. **Main Task** - Represents the overall outcome from the AI response
2. **Subtasks** - Individual actionable items within that response
3. **Session Link** - Connection back to the original conversation

## Architecture

### Database Schema

#### Main Tasks Table (`main_tasks`)
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- title (TEXT, NOT NULL)
- description (TEXT)
- linked_session_id (UUID, Foreign Key to sessions)
- linked_interaction_id (UUID, Foreign Key to interactions)
- status (TEXT: 'pending', 'in_progress', 'completed', 'cancelled')
- priority (TEXT: 'low', 'medium', 'high')
- category (TEXT, NOT NULL)
- due_date (TIMESTAMPTZ)
- estimated_duration (INTEGER, minutes)
- actual_duration (INTEGER, minutes)
- progress (INTEGER, 0-100)
- tags (TEXT[])
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### Subtasks Table (`subtasks`)
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- parent_task_id (UUID, Foreign Key to main_tasks)
- title (TEXT, NOT NULL)
- description (TEXT)
- status (TEXT: 'pending', 'in_progress', 'completed', 'cancelled')
- priority (TEXT: 'low', 'medium', 'high')
- order_index (INTEGER)
- estimated_duration (INTEGER, minutes)
- actual_duration (INTEGER, minutes)
- due_date (TIMESTAMPTZ)
- completed_at (TIMESTAMPTZ)
- tags (TEXT[])
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Key Features

#### Automatic Progress Calculation
- Main task progress is automatically calculated based on completed subtasks
- Progress updates in real-time when subtasks are marked as completed
- Database trigger ensures consistency

#### Session Linking
- Each main task can be linked to a specific session and interaction
- Users can navigate back to the original conversation context
- Maintains traceability between tasks and AI conversations

#### Smart Task Extraction
- Automatically extracts actionable items from AI responses
- Uses pattern matching to identify tasks, action items, and to-dos
- Supports bullet points, numbered lists, and natural language

## Usage Flow

### 1. AI Response Processing
```
User sends message → AI generates response → User clicks "Save as Task"
```

### 2. Task Extraction
```
AI Response → TaskExtractionService.extractTasksFromResponse()
- Generates main task title from response summary
- Extracts actionable items as subtasks
- Determines priorities and categories
```

### 3. Database Storage
```
ExtractedTask → createHierarchicalTask()
- Creates main task with session link
- Creates subtasks with parent reference
- Stores metadata for traceability
```

### 4. Task Management
```
Main Task Card → Expandable subtasks
- Click to expand/collapse subtasks
- Check/uncheck subtasks to update progress
- Edit titles inline
- Delete tasks and subtasks
- View linked session
```

## Components

### MainTaskCard
- Displays main task with expandable subtasks
- Shows progress bar and completion stats
- Inline editing for task titles
- Session linking functionality

### HierarchicalTasks Page
- Lists all main tasks with filtering and search
- Statistics dashboard
- Status and priority filters
- Empty state handling

### TaskExtractionService
- Extracts tasks from AI responses
- Pattern matching for actionable items
- Priority and category detection
- Database integration

## API Methods

### SupabaseService
```typescript
// Create tasks
createMainTask(task: Omit<MainTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<MainTask>
createSubTask(subtask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubTask>

// Retrieve tasks
getMainTasks(): Promise<MainTask[]>
getMainTaskWithSubtasks(taskId: string): Promise<{ mainTask: MainTask; subtasks: SubTask[] } | null>
getHierarchicalTasksBySession(sessionId: string): Promise<{ mainTask: MainTask; subtasks: SubTask[] }[]>

// Update tasks
updateMainTask(taskId: string, updates: Partial<MainTask>): Promise<void>
updateSubTask(subtaskId: string, updates: Partial<SubTask>): Promise<void>

// Delete tasks
deleteMainTask(taskId: string): Promise<void>
deleteSubTask(subtaskId: string): Promise<void>
```

## Database Functions

### Helper Functions
```sql
-- Get main task with all subtasks
get_main_task_with_subtasks(task_uuid UUID)

-- Get all main tasks with subtask counts
get_main_tasks_with_subtask_counts()

-- Get tasks by session
get_tasks_by_session(session_uuid UUID)
```

### Automatic Triggers
```sql
-- Update main task progress when subtasks change
update_main_task_progress()

-- Update timestamps
update_updated_at_column()
```

## Migration

To set up the hierarchical task system:

1. Run the migration script:
```bash
node scripts/migrate-hierarchical-tasks.js
```

2. Update your frontend to use the new components:
```typescript
import { TaskExtractionService } from './services/taskExtractionService';
import MainTaskCard from './components/MainTaskCard';
import HierarchicalTasks from './pages/HierarchicalTasks';
```

## Benefits

1. **Cleaner Task List** - One main task per AI response instead of multiple scattered tasks
2. **Better Organization** - Hierarchical structure makes it easier to understand relationships
3. **Progress Tracking** - Automatic progress calculation based on subtask completion
4. **Context Preservation** - Direct links back to original conversations
5. **Scalability** - Supports complex multi-step tasks and projects
6. **Flexibility** - Can handle both simple and complex task structures

## Future Enhancements

- **Kanban Board View** - Drag and drop interface for task management
- **Timeline View** - Visual timeline of task dependencies
- **Daily Brief Integration** - Automatic task summarization
- **AI-Powered Task Suggestions** - Smart task extraction improvements
- **Task Templates** - Reusable task structures
- **Collaboration** - Shared tasks and team workflows 