# NovelWeave CLI

Terminal User Interface for NovelWeave

## Installation

```bash
npm install -g @novelweave/cli@alpha
```

Then, make sure you place your NovelWeave API token in the CLI config:

```bash
novelweave config # this opens up your editor
```

You can find your NovelWeave API token on your profile page at [app.novelweave.ai](https://app.novelweave.ai), and place it in the `novelweaveToken` field in the CLI config.

## Known Issues

### Theme Detection

We don't detect the theme of your terminal, and are aware the the current theme doesn't work well on light mode terminals. Switch to the light theme using using `novelweave config`.

### Outdated dependency warnings

When installing NovelWeave CLI you'll be greeted by some scary looking dependency deprecation warnings. We're aware of the issue and will resolve it shortly.

### Windows Support

We've only tested the CLI on Mac and Linux, and are aware that there are some issues on Windows. For now, if you can, we advise you to use a WSL environment to run the CLI.

## Usage

### Interactive Mode

```bash
# Start interactive chat session
novelweave

# Start with a specific mode
novelweave --mode architect

# Start with a specific workspace
novelweave --workspace /path/to/project
```

### CI Mode (Non-Interactive)

CI mode allows NovelWeave to run in automated environments like CI/CD pipelines without requiring user interaction.

```bash
# Run in CI mode with a prompt
novelweave --ci "Implement feature X"

# Run in CI mode with piped input
echo "Fix the bug in app.ts" | novelweave --ci

# Run in CI mode with timeout (in seconds)
novelweave --ci "Run tests" --timeout 300
```

#### CI Mode Behavior

When running in CI mode (`--ci` flag):

1. **No User Interaction**: All approval requests are handled automatically based on configuration
2. **Auto-Approval/Rejection**: Operations are approved or rejected based on your auto-approval settings
3. **Follow-up Questions**: Automatically responded with a message instructing the AI to make autonomous decisions
4. **Automatic Exit**: The CLI exits automatically when the task completes or times out

#### Auto-Approval Configuration

CI mode respects your auto-approval configuration. Edit your config file with `novelweave config` to customize:

```json
{
	"autoApproval": {
		"enabled": true,
		"read": {
			"enabled": true,
			"outside": true
		},
		"write": {
			"enabled": true,
			"outside": false,
			"protected": false
		},
		"execute": {
			"enabled": true,
			"allowed": ["npm", "git", "pnpm"],
			"denied": ["rm -rf", "sudo"]
		},
		"browser": {
			"enabled": false
		},
		"mcp": {
			"enabled": true
		},
		"mode": {
			"enabled": true
		},
		"subtasks": {
			"enabled": true
		},
		"question": {
			"enabled": false,
			"timeout": 60
		},
		"retry": {
			"enabled": true,
			"delay": 10
		},
		"todo": {
			"enabled": true
		}
	}
}
```

**Configuration Options:**

- `read`: Auto-approve file read operations
    - `outside`: Allow reading files outside workspace
- `write`: Auto-approve file write operations
    - `outside`: Allow writing files outside workspace
    - `protected`: Allow writing to protected files (e.g., package.json)
- `execute`: Auto-approve command execution
    - `allowed`: List of allowed command patterns (e.g., ["npm", "git"])
    - `denied`: List of denied command patterns (takes precedence)
- `browser`: Auto-approve browser operations
- `mcp`: Auto-approve MCP tool usage
- `mode`: Auto-approve mode switching
- `subtasks`: Auto-approve subtask creation
- `question`: Auto-approve follow-up questions
- `retry`: Auto-approve API retry requests
- `todo`: Auto-approve todo list updates

#### CI Mode Follow-up Questions

In CI mode, when the AI asks a follow-up question, it receives this response:

> "This process is running in non-interactive CI mode. The user cannot make decisions, so you should make the decision autonomously."

This instructs the AI to proceed without user input.

#### Exit Codes

- `0`: Success (task completed)
- `124`: Timeout (task exceeded time limit)
- `1`: Error (initialization or execution failure)

#### Example CI/CD Integration

```yaml
# GitHub Actions example
- name: Run NovelWeave
  run: |
      echo "Implement the new feature" | novelweave --ci --timeout 600
```

## Local Development

### DevTools

In order to run the CLI with devtools, add `DEV=true` to your `pnpm start` command, and then run `npx react-devtools` to show the devtools inspector.
