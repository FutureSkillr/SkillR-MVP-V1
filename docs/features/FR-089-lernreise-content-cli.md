# FR-089: Lernreise Content CLI Tool (`lrtool`)

**Status:** draft
**Priority:** must
**Created:** 2026-02-21
**Entity:** SkillR

## Problem

Lernreise content (courses, modules, tasks) is currently authored and managed via the Python-based `hoc-stage` CLI. This tool lives in a separate repository, uses a different language (Python) than the maindfull.LEARNING engine (Go), and cannot be directly integrated into the platform. Content authors need a Go-native CLI that can be distributed as a single binary and shares data models with the maindfull.LEARNING engine.

## Solution

Build `lrtool`, a Go CLI using the Cobra framework, that provides the `composer` and `coach` command groups from hoc-stage:

### Composer Commands (Content Authoring)

| Command | Description | Source |
|---------|------------|--------|
| `lrtool composer init` | Initialize `learning_paths/` directory structure | hoc-stage composer init |
| `lrtool composer validate` | Validate content against Go struct schemas | hoc-stage composer validate |
| `lrtool composer build` | Build `publication.json` from YAML+MD files | hoc-stage composer build |
| `lrtool composer tree` | Display module dependency graph (text tree) | hoc-stage composer tree |

### Coach Commands (Publishing)

| Command | Description | Source |
|---------|------------|--------|
| `lrtool coach configure` | Set Firestore credentials interactively | hoc-stage coach configure |
| `lrtool coach publish` | Upload publication to Firestore | hoc-stage coach publish |
| `lrtool coach list` | List published courses | New |
| `lrtool coach unpublish` | Remove course from Firestore | New |

### Content Format (Preserved from hoc-stage)

```
learning_paths/
├── {course_id}/
│   ├── course.yml
│   ├── {module_id}/
│   │   ├── module.yml
│   │   └── tasks/
│   │       └── {task_id}.md    # YAML frontmatter + Markdown body
```

### Go Data Models

```go
type Course struct {
    ID              string    `yaml:"id" json:"id"`
    App             string    `yaml:"app" json:"app"`
    Name            string    `yaml:"name" json:"name"`
    DescriptionShort string  `yaml:"description_short" json:"description_short"`
    Version         string    `yaml:"version" json:"version"`
    PublishedDate   string    `yaml:"published_date,omitempty" json:"published_date,omitempty"`
    Modules         []Module  `yaml:"-" json:"modules"`
}

type Module struct {
    ID                  string   `yaml:"id" json:"id"`
    App                 string   `yaml:"app" json:"app"`
    NameShort           string   `yaml:"name_short" json:"name_short"`
    Name                string   `yaml:"name" json:"name"`
    Duration            string   `yaml:"duration" json:"duration"`
    Severity            string   `yaml:"severity" json:"severity"`
    Badge               bool     `yaml:"badge" json:"badge"`
    RequirementsModules []string `yaml:"requirements_modules" json:"requirements_modules"`
    GoalsModules        []string `yaml:"goals_modules" json:"goals_modules"`
    Tasks               []Task   `yaml:"-" json:"tasks"`
}

type Task struct {
    ID               string   `yaml:"id" json:"id"`
    Name             string   `yaml:"name" json:"name"`
    NameShort        string   `yaml:"name_short,omitempty" json:"name_short,omitempty"`
    DescriptionShort string   `yaml:"description_short,omitempty" json:"description_short,omitempty"`
    State            string   `yaml:"state,omitempty" json:"state,omitempty"`
    Sources          []Source `yaml:"sources,omitempty" json:"sources,omitempty"`
    MemoryID         string   `yaml:"memory_id,omitempty" json:"memory_id,omitempty"`
    Content          string   `yaml:"-" json:"content,omitempty"`
}
```

## Acceptance Criteria

- [ ] `lrtool composer init` creates the `learning_paths/` directory structure
- [ ] `lrtool composer validate` validates all courses/modules/tasks against Go struct schemas
- [ ] Validation detects: missing required fields, duplicate IDs, broken dependency links, cycles
- [ ] `lrtool composer build` produces `publication.json` identical to hoc-stage output
- [ ] `lrtool composer tree` displays a text-based dependency tree with cycle warnings
- [ ] `lrtool coach publish --dry-run` shows what would be uploaded without writing
- [ ] `lrtool coach publish` uploads to Firestore `lernpfad_template` collection
- [ ] Reads the same YAML+MD format as hoc-stage (backward compatible)
- [ ] Distributed as a single binary (no Python runtime needed)
- [ ] Unit tests for all parsing, validation, and build logic

## Dependencies

- TC-033: Existing Systems Inventory
- TC-034: Backend Toolset Migration Strategy
- FR-074: Lernreise Catalog Selection (data model alignment)

## Notes

- Cobra framework for CLI structure (used by kubectl, gh, docker)
- `gopkg.in/yaml.v3` for YAML parsing
- `github.com/yuin/goldmark` for Markdown frontmatter parsing
- Go `gonum/graph` or custom implementation for dependency graphs
- Firebase Admin Go SDK for Firestore operations
