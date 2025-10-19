# Agent Skills

Agent Skills is NovelWeave's modular knowledge system that provides your AI assistant with specialized expertise on-demand. Think of Skills as expert knowledge modules that the AI can activate when needed to improve the quality and accuracy of its assistance.

## Overview

Skills allow you to:

- **Enhance AI capabilities** - Give the AI access to specialized knowledge in specific domains
- **Maintain consistency** - Share team guidelines and best practices across projects
- **Customize behavior** - Add your own expertise without modifying prompts
- **Scale knowledge** - Build a reusable library of expert knowledge

## How Skills Work

### Three-Tier System

NovelWeave organizes Skills into three tiers:

1. **Extension Skills** - Built-in professional Skills shipped with NovelWeave
2. **Project Skills** - Team-specific Skills stored in `.agent/skills/`
3. **Personal Skills** - Your private Skills library in `~/.novelweave/skills/`

Skills from all tiers are available simultaneously, with higher tiers (personal, project) taking precedence when names conflict.

### Smart Activation

When you interact with the AI, it:

1. **Sees available Skills** - Reviews all Skills and their descriptions
2. **Selects relevant Skills** - Chooses Skills matching your task
3. **Declares activation** - Shows `[USING SKILL: skill-name]` in responses
4. **Applies knowledge** - Uses the Skill's content to inform its work

This happens automatically - you don't need to manually activate Skills unless you want to.

## Built-in Skills

NovelWeave includes 14 professional Skills out of the box:

### Genre Knowledge

- **romance-novel-conventions** - Romance writing conventions and emotional beats
- **mystery-novel-conventions** - Mystery plotting, clues, and pacing
- **fantasy-world-building** - Fantasy worldbuilding and magic systems

### Writing Techniques

- **natural-dialogue-techniques** - Crafting realistic dialogue
- **scene-structure-techniques** - Scene construction and pacing

### Quality Assurance

- **story-consistency-monitor** - Track story consistency
- **forgotten-elements-reminder** - Catch overlooked plot elements
- **setting-detector** - Analyze setting descriptions
- **style-detector** - Maintain writing style consistency
- **requirement-detector** - Ensure requirements are met
- **pre-write-checklist** - Pre-writing preparation

### Workflow

- **NovelWeave 小说创作工作流** - NovelWeave novel writing workflow (Chinese)
- **novel-writer-workflow-guide** - Complete workflow guide
- **getting-started-guide** - Quick start guide

## Creating Your First Skill

### 1. Create a New Skill

Use the command palette or Skills panel to create a new Skill:

```
Command: NovelWeave: Create Agent Skill
```

Choose:

- **Personal** - For your private Skills library
- **Project** - For team-shared Skills

### 2. Name Your Skill

Use kebab-case (lowercase with hyphens):

- ✅ `character-development`
- ✅ `plot-twist-techniques`
- ❌ `CharacterDevelopment`
- ❌ `plot_twist`

### 3. Edit the Skill File

A SKILL.md file will be created with this structure:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill provides
version: 1.0.0
keywords:
    - keyword1
    - keyword2
whenToUse: When to activate this Skill
---

# Your Skill Title

## Overview

What this Skill teaches the AI...

## Guidelines

Key principles and techniques...

## Examples

Practical examples...
```

### 4. Write Your Content

Fill in the Skill content with:

- **Clear guidelines** - Specific, actionable instructions
- **Examples** - Real-world demonstrations
- **Best practices** - Do's and don'ts
- **Checklists** - Validation criteria

## Skill Metadata

The YAML frontmatter configures how the Skill behaves:

### Required Fields

```yaml
name: skill-name
description: One-line description
```

### Optional Fields

```yaml
version: 1.0.0 # Semantic versioning
keywords: [keyword1, keyword2] # For AI matching
whenToUse: Specific scenarios... # Usage guidance
requiredModes: [code, architect] # Mode restrictions
allowedToolGroups: [read, edit] # Tool restrictions
```

## Using Skills

### Automatic Usage

The AI automatically activates Skills based on your request:

**Example:**

```
You: Help me write a romance scene
AI: [USING SKILL: romance-novel-conventions]
    [USING SKILL: natural-dialogue-techniques]

    Based on romance writing conventions, here's a scene...
```

### Manual Activation

You can request specific Skills:

```
You: Use the consistency-checker Skill to review my novel
AI: [USING SKILL: story-consistency-monitor]

    Checking your novel for consistency...
```

### Viewing Active Skills

The Skills panel shows which Skills are currently active (green indicator).

## Managing Skills

### Browse Skills

1. Open the Skills panel (sidebar icon or command palette)
2. View Skills organized by source:
    - **Active Skills** - Currently in use
    - **Extension Skills** - Built-in
    - **Project Skills** - Team shared
    - **Personal Skills** - Your library

### View Skill Details

Click a Skill card to see:

- Full description
- Keywords and usage scenarios
- Version and metadata

Click "View Full Content" to see the complete Skill in an editor.

### Refresh Skills

After creating or modifying Skills:

1. Click the refresh icon in the Skills panel
2. Or reload VS Code window

## Team Collaboration

### Sharing Project Skills

1. Create Skills in your project's `.agent/skills/` directory
2. Commit Skills to your Git repository
3. Team members automatically get Skills when they pull

### Version Control

Use semantic versioning for Skills:

```yaml
version: 1.2.0 # MAJOR.MINOR.PATCH
```

Update the version when you modify a Skill:

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, small improvements

### Best Practices

**Do:**

- ✅ Keep Skills focused on a single topic
- ✅ Use clear, actionable language
- ✅ Include practical examples
- ✅ Update version numbers when changing Skills
- ✅ Add comprehensive keywords for discoverability

**Don't:**

- ❌ Create overlapping Skills
- ❌ Use vague or abstract descriptions
- ❌ Include sensitive or private information
- ❌ Make Skills too long (>2000 lines)

## Advanced Features

### Mode Integration

Skills can be restricted to specific Modes:

```yaml
requiredModes:
    - code
    - architect
```

This Skill will only be available when using Code or Architect Mode.

### Recommended Skills

Each Mode can recommend specific Skills. When you switch Modes, relevant Skills are highlighted.

### Tool Restrictions

Control which tools the AI can use when a Skill is active:

```yaml
allowedToolGroups:
    - read # Can read files
    - search # Can search codebase
    # But cannot edit or execute commands
```

## Troubleshooting

### Skills Not Appearing

**Check:**

1. File is named `SKILL.md` (case-sensitive)
2. YAML frontmatter is valid
3. File location is correct:
    - Extension: `dist/templates/skills/` (built-in only)
    - Project: `.agent/skills/`
    - Personal: `~/.novelweave/skills/`
4. Refresh the Skills panel

### AI Not Using Skills

**Check:**

1. Skill description and keywords are relevant to your task
2. `whenToUse` field clearly describes appropriate scenarios
3. Skill isn't restricted by `requiredModes`
4. Try explicitly mentioning the Skill in your request

### Skill Content Not Loading

**Check:**

1. File encoding is UTF-8
2. Markdown syntax is valid
3. No special characters in YAML frontmatter
4. Check VS Code Output panel for errors

## Examples

### Simple Skill: Character Naming

```markdown
---
name: character-naming-guide
description: Guidelines for creating memorable character names
version: 1.0.0
keywords:
    - character
    - naming
    - names
    - protagonist
whenToUse: When creating or reviewing character names
---

# Character Naming Guide

## Principles

1. **Memorable** - Easy to remember and pronounce
2. **Distinctive** - Each character should have a unique name
3. **Appropriate** - Matches character's background and setting

## Techniques

### Sound Symbolism

- Hard consonants (K, T, D) suggest strength
- Soft sounds (L, M, S) suggest gentleness
- Example: "Drake" vs "Lily"

### Cultural Consistency

- Research appropriate names for character's culture
- Avoid mixing incompatible naming traditions
- Example: Don't mix Japanese first names with Italian surnames

## Checklist

- [ ] Name is easy to pronounce
- [ ] Name doesn't sound like other characters
- [ ] Name fits the setting and time period
- [ ] Name isn't unintentionally humorous
```

### Advanced Skill: Plot Structure

```markdown
---
name: three-act-structure
description: Apply three-act structure to novel plotting
version: 1.0.0
keywords:
    - plot
    - structure
    - acts
    - story structure
whenToUse: When planning or analyzing novel plot structure
requiredModes:
    - architect
    - code
---

# Three-Act Structure

## Overview

The three-act structure divides your story into Setup, Confrontation, and Resolution.

## Act I: Setup (25%)

**Purpose:** Introduce world, characters, and conflict

**Key Beats:**

- Opening Image - Show the protagonist's "before" state
- Inciting Incident - Event that disrupts normal life
- First Plot Point - Protagonist commits to the journey

**Example:**
In Harry Potter, Act I ends when Harry decides to attend Hogwarts.

## Act II: Confrontation (50%)

**Purpose:** Protagonist faces escalating obstacles

**Key Beats:**

- Midpoint - Major revelation or reversal
- Complications - Increasing challenges
- All Is Lost - Lowest point

**Example:**
Midpoint: Harry learns about the Chamber of Secrets
All Is Lost: Ginny is taken into the Chamber

## Act III: Resolution (25%)

**Purpose:** Climax and resolution

**Key Beats:**

- Climax - Final confrontation
- Resolution - Aftermath and new equilibrium
- Closing Image - Show the protagonist's "after" state

**Example:**
Climax: Harry defeats Voldemort in the Chamber
Resolution: Hogwarts is saved, students return

## Checklist

- [ ] Act I establishes stakes and world
- [ ] Inciting incident happens early (10-15%)
- [ ] Midpoint creates meaningful change
- [ ] All Is Lost moment is genuinely dark
- [ ] Climax resolves the main conflict
- [ ] Closing mirrors opening with growth shown
```

## Resources

- [Agent Skills User Guide](../../../docs/agent-skills-user-guide.md) - Detailed usage instructions
- [Agent Skills Developer Guide](../../../docs/agent-skills-developer-guide.md) - Technical architecture
- [Skills Writing Best Practices](../../../docs/writing-skills-best-practices.md) - Expert authoring guide

## What's Next?

- **Create your first Skill** - Try creating a simple Skill for a topic you know well
- **Explore built-in Skills** - View the source of included Skills for inspiration
- **Share with your team** - Add project Skills to standardize your workflow

---

**Need help?** Ask in the [GitHub Discussions](https://github.com/wordflowlab/novelweave/discussions) or check the [FAQ](/faq).
